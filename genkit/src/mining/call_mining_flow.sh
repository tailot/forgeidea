#!/bin/zsh

# Usage:
# For batch mode:
# ./call_mining_flow.sh <context> <language> <count>
# Example:
# ./call_mining_flow.sh "tech startups" "english" 5
# Example:
# ./call_mining_flow.sh "more tech" "english" 2
#
# For interactive mode:
# ./call_mining_flow.sh <language>
# Example:
# ./call_mining_flow.sh "english"
# Example:
# ./call_mining_flow.sh "french"

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

      local inner_json_string
      if ! echo "$response" | jq -e '.result' > /dev/null; then
          echo "Warning: 'result' field missing, null, or false in response for context: $context." >&2
          echo "Response received: $response" >&2
          echo "$response"
          continue
      fi
      inner_json_string=$(echo "$response" | jq -r '.result')

      if ! echo "$inner_json_string" | jq -e . > /dev/null 2>&1; then
          echo "Warning: Content of 'result' field is not valid JSON for context: $context." >&2
          echo "Content: $inner_json_string" >&2
          echo "$response"
          continue
      fi

      local idea_val
      local score_val
      local competitors_val

      idea_val=$(echo "$inner_json_string" | jq -r '.idea // "N/A"')
      score_val=$(echo "$inner_json_string" | jq -r '.score // "N/A"')
      competitors_val=$(echo "$inner_json_string" | jq -r '.competitors // "N/A"')

      echo "Idea: $idea_val" >&2
      echo "Score: $score_val" >&2
      echo "Competitors: $competitors_val" >&2
      echo "---" >&2

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
    local script_name
    script_name=$(basename "$0")
    echo "Usage:" >&2
    echo "  For batch mode: $script_name <context> <language> <count>" >&2
    echo "  Example: $script_name \"tech startups\" \"english\" 5" >&2
    echo "           $script_name \"web3 ideas\" \"spanish\" 10" >&2
    echo "" >&2
    echo "  For interactive mode: $script_name <language>" >&2
    echo "  Example: $script_name \"english\"" >&2
    echo "           $script_name \"french\"" >&2
    exit 1
  fi
}

main "$@"