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

  if [[ $# -eq 1 ]]; then
    # Interactive mode
    local language="$1"

    while true; do
      echo -n "Enter context (or type 'exit' or 'quit' to finish): " >&2
      read -r context_input

      local context_input_lower
      context_input_lower=$(echo "$context_input" | tr '[:upper:]' '[:lower:]')

      if [[ -z "$context_input" ]] || \
         [[ "$context_input_lower" == "exit" ]] || \
         [[ "$context_input_lower" == "quit" ]]; then
        echo "Exiting interactive mode." >&2
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
          echo "Error: Failed to create JSON payload for context: $context." >&2
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

      printf "%s" "$response" | tr -dc '[:print:]\t\n\r' | jq '.'
    
    done
    exit 0

  elif [[ $# -eq 3 ]]; then
    # Batch mode
    local context="$1"
    local language="$2"
    local count="$3"
    local i

    echo "Batch mode: Calling miningFlow $count times for context: '$context', language: '$language'..." >&2

    for i in $(seq 1 "$count"); do
      echo "Attempt $i of $count..." >&2

      local payload
      payload=$(jq -n \
                --arg ctx "$context" \
                --arg lang "$language" \
                '{data: {context: $ctx, language: $lang}}')

      if [[ $? -ne 0 ]]; then
          echo "Error: Failed to create JSON payload for attempt $i." >&2
          continue # Skip to next attempt
      fi

      local response
      response=$(curl -s -X POST \
                 -H "Content-Type: application/json" \
                 -d "$payload" \
                 "$MINING_FLOW_URL")

      if [[ $? -ne 0 ]]; then
        echo "Error: curl command failed for attempt $i." >&2
        continue # Skip to next attempt
      fi

    printf "%s" "$response" | tr -dc '[:print:]\t\n\r' | jq '.'

    done

    echo "Batch processing complete." >&2
    exit 0
  else
    # Incorrect usage
    local script_name
    script_name=$(basename "$0")
    echo "Usage:" >&2
    echo "  For batch mode: $script_name <context> <language> <count>" >&2
    echo "  Example: $script_name \"tech startups\" \"english\" 5" >&2
    echo "" >&2
    echo "  For interactive mode: $script_name <language>" >&2
    echo "  Example: $script_name \"english\"" >&2
    exit 1
  fi
}

main "$@"