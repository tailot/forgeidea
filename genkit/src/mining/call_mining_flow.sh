#!/bin/zsh

# Usage:
# ./call_mining_flow.sh <context> <language> <count> 
# Example:
# ./call_mining_flow.sh "tech startups" "english" 5

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

  if [[ $# -ne 3 ]]; then
    echo "Usage: $0 <context> <language> <count>" >&2
    echo "Example: $0 \"tech startups\" \"english\" 5" >&2
    exit 1
  fi

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
}

main "$@"
