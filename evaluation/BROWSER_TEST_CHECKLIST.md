# Manual Browser Test Checklist

## Test 1: WebGPU-capable browser

- [ ] Open Chrome or Edge with WebGPU support
- [ ] Upload an image
- [ ] Confirm YOLOS-tiny loads
- [ ] Confirm inference succeeds
- [ ] Confirm bounding boxes render
- [ ] Confirm detection confidence is shown
- [ ] Confirm backend shows `webgpu`
- [ ] Confirm performance values are recorded

## Test 2: WebGPU unavailable browser

- [ ] Open a browser or environment without WebGPU
- [ ] Upload an image
- [ ] Confirm YOLOS-tiny loads
- [ ] Confirm inference succeeds
- [ ] Confirm backend shows `wasm`
- [ ] Confirm fallback information is shown
- [ ] Confirm performance values are recorded

## Test 3: WebGPU initialization failure

- [ ] Force or reproduce a WebGPU initialization failure
- [ ] Confirm the app retries with WASM
- [ ] Confirm the final backend is `wasm`
- [ ] Confirm no infinite fallback loop occurs

## Test 4: Second analysis

- [ ] Run a second image analysis
- [ ] Confirm the model is not reloaded unnecessarily
- [ ] Confirm `subsequentInferenceTimeMs` is recorded
- [ ] Confirm `firstInferenceTimeMs` is preserved from the initial run

## Notes

- If a test cannot be executed locally, mark it as `unverified` rather than assuming success.
- Use the detailed view to inspect performance timing and backend fallback information.
