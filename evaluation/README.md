# YOLOS-tiny Evaluation

This folder documents the MVP-oriented evaluation surface for the current local object detector.

## Model

- `Xenova/yolos-tiny`

## What is evaluated

- `person`
- `tv`
- `laptop`
- `chair`
- `couch`
- `bed`
- `dining table`
- `cell phone`
- `book`
- `bottle`
- `cup`
- `clock`
- `plant` is approximated via `potted plant` if the model surfaces it

## Important limitation

- `air conditioner` is not directly supported by YOLOS-tiny / COCO
- `mirror` is also not a dedicated class in this model

## Status

- This evaluation layer currently serves as a structured reference for manual or future automated evaluation
- Do not treat it as a quantitative benchmark until real test images are scored
