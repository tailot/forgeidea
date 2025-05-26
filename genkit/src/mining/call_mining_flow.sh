#!/bin/zsh

# Usage:
# For batch mode:
# ./call_mining_flow.sh <context> <language> <count> 
# Example:
# ./call_mining_flow.sh "tech startups" "english" 5
#
# For interactive mode:
# ./call_mining_flow.sh <language>
# Example:
# ./call_mining_flow.sh "english"

MINING_FLOW_URL="http://localhost:4001/miningFlow"

check_deps() {
  for cmd_name in curl jq; do
    if ! command -v "$cmd_name" &> /dev/null; then
      echo "Error: Required command '$cmd_name' not found. Please install it." >&2
      exit 1
    fi
  done
}

main() {
  check_deps

  SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
  CSV_FILE="$SCRIPT_DIR/mining_results.csv"
  local header_written=false # Default to false

  # If CSV file already exists and has content, assume header is written
  if [[ -s "$CSV_FILE" ]]; then
    header_written=true
  fi

  # Function to write data to CSV (defined within main to access its scope)
  write_to_csv() {
    local json_data_to_write="$1" # Renamed to avoid conflict if any global json_data existed

    if ! echo "$json_data_to_write" | jq -e 'type == "object"' > /dev/null; then
      echo "Warning: Data for CSV is not a JSON object. Skipping CSV write for this entry." >&2
      echo "Data received: $json_data_to_write" >&2
      return
    fi

    # Check if header needs to be written (only if header_written is currently false)
    if [[ "$header_written" == false ]]; then
      # Attempt to write header
      if echo "$json_data_to_write" | jq -r 'keys_unsorted | @csv' > "$CSV_FILE"; then
        header_written=true # Mark header as written
      else
        echo "Error: Failed to write CSV header to $CSV_FILE. Data for this entry will not be written." >&2
        # Optionally, clean up the potentially partially written file if header fails
        # rm -f "$CSV_FILE" # Example: uncomment to remove file on header write failure
        return
      fi
    fi

    # Append data row. This is reached if header_written was already true, or became true just now.
    # This assumes that if the file existed and header_written was set to true initially,
    # the new data's structure is compatible with the existing header.
    if ! echo "$json_data_to_write" | jq -r '. | @csv' >> "$CSV_FILE"; then
      echo "Error: Failed to append data to $CSV_FILE." >&2
    fi
  }

  if [[ $# -eq 1 ]]; then
    local language="$1"

    while true; do
      echo -n "Enter context (or type 'exit' or 'quit' to finish): " >&2
      read -r context_input

      local context_input_lower
      context_input_lower=$(echo "$context_input" | tr '[:upper:]' '[:lower:]')

      if [[ -z "$context_input" ]] || \
         [[ "$context_input_lower" == "exit" ]] || \
         [[ "$context_input_lower" == "quit" ]]; then
        break
      fi

      local context="$context_input"

      echo "Processing context: '$context' with language: '$language'..." >&2

      local payload
      payload=$(jq -n \
                --arg ctx "$context" \
                --arg lang "$language" \
                '{data: {context: $ctx, language: $lang}}')

      if [[ $? -ne 0 ]]; then
          echo "Error creating JSON payload for context: $context." >&2
          continue
      fi

      local response    
      response=$(curl -s -X POST \
                 -H "Content-Type: application/json" \
                 -d "$payload" \
                 "$MINING_FLOW_URL")

      if [[ $? -ne 0 ]]; then
        echo "Error: curl command failed for context: $context." >&2
        continue
      fi
      
      # Process for CSV
      local inner_json_string
      if ! echo "$response" | jq -e '.result' > /dev/null; then
          echo "Warning: 'result' field missing, null, or false in response for context: $context." >&2
          echo "Response received: $response" >&2
          # Still print the raw response as per previous behavior
          echo "$response"
          continue
      fi
      inner_json_string=$(echo "$response" | jq -r '.result')

      if ! echo "$inner_json_string" | jq -e . > /dev/null 2>&1; then
          echo "Warning: Content of 'result' field is not valid JSON for context: $context." >&2
          echo "Content: $inner_json_string" >&2
          # Still print the raw response
          echo "$response"
          continue
      fi
      
      write_to_csv "$inner_json_string"
      # echo "$response" # Removed: Do not print raw response to stdout in interactive mode
      echo "Successfully processed context '$context' and saved to CSV." >&2

    done
    exit 0
  elif [[ $# -eq 3 ]]; then
    local context="$1"
    local language="$2"
    local count="$3"
    local i
    local all_results="[]"
  
    echo "Calling miningFlow $count times with context: '$context', language: '$language'..." >&2

    for i in $(seq 1 "$count"); do
      echo -n "Attempt $i of $count... " >&2

      local payload
      payload=$(jq -n \
                --arg ctx "$context" \
                --arg lang "$language" \
                '{data: {context: $ctx, language: $lang}}')

      if [[ $? -ne 0 ]]; then
          echo "Error creating JSON payload for attempt $i." >&2
          continue
      fi

      local response    
      response=$(curl -s -X POST \
                 -H "Content-Type: application/json" \
                 -d "$payload" \
                 "$MINING_FLOW_URL")

      if [[ $? -ne 0 ]]; then
        echo "Error: curl command failed for attempt $i." >&2
        continue
      fi

      local inner_json_string    
      if ! echo "$response" | jq -e '.result' > /dev/null; then
          echo "Warning: 'result' field missing, null, or false in response for attempt $i." >&2
          echo "Response received: $response" >&2
          continue
      fi
      inner_json_string=$(echo "$response" | jq -r '.result')

      if ! echo "$inner_json_string" | jq -e . > /dev/null 2>&1; then
          echo "Warning: Content of 'result' field is not valid JSON for attempt $i." >&2
          echo "Content: $inner_json_string" >&2
          continue
      fi
      
      write_to_csv "$inner_json_string"

      all_results=$(echo "$all_results" | jq --argjson item "$inner_json_string" '. + [$item]')
      if [[ $? -ne 0 ]]; then
          echo "Error: jq failed to add item for attempt $i." >&2
      else
          echo "OK." >&2
      fi
    done

    echo "Processing complete." >&2
    echo "$all_results" | jq .
  else
    echo "Usage: $0 <language>" >&2
    echo "   or: $0 <context> <language> <count>" >&2
    echo "Example (interactive): $0 english" >&2
    echo "Example (batch): $0 \"tech startups\" \"english\" 5" >&2
    exit 1
  fi
}

main "$@"
