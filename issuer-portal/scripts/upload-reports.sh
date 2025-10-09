#!/bin/bash

cd "$(dirname "$0")/.."

for file in ../data/wendys/reports/*.xls; do
  filename=$(basename "$file")
  echo "Uploading: $filename"
  npx supabase storage cp "$file" ss:///documents/wen-annual-meeting-2025/reports/"$filename" --experimental --linked
done

echo "✅ Upload complete!"
