# VITRION

Research prototype for evidence-aware X-ray fracture mapping. **Research use only; not a diagnosis.** No model or reviewed mesh is bundled, so analysis currently reports `not_supported` and does not invent findings.

## Stack and layout

- Python 3.11, FastAPI API, Pillow raster validation, optional pydicom parser; plain HTML/CSS/JavaScript research viewer. A production viewer can replace the web shell without changing the finding contract.
- `src/vitrion/data/bones.json` and `anatomy.py`: 206-bone adult reference inventory, group counts, imaging tiers, landmarks, coordinate definitions and fail-fast checks.
- `viewer.py`, `api.py`, `web/`: input validation, image display, metadata and research status.
- `fracture_ai.py`, `localization.py`, `characterization.py`: per-region model interface and independent output gates.
- `bone_mapping.py`, `contracts.py`, `results.py`: Mode A mapping and shared finding contract. Modes B/C are explicit unimplemented gates.
- `validation.py`, `security.py`: release evidence and persistence prerequisites.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dicom,test]"
python tools/preview.py
```

Open `http://127.0.0.1:8765`. The launcher uses `.venv` automatically and serves both the website and `/api/analyze` on the same origin. PNG/JPEG uploads are decoded, validated and re-encoded without embedded metadata. DICOM metadata validation uses the optional parser; de-identified pixel preview remains gated. A successful upload reports image dimensions and explicit model availability; an uninstalled fracture model does not return findings.

Run tests with `.\.venv\Scripts\python.exe -m unittest discover -s tests -q`. `npm run check` checks browser syntax.

## Homepage and anatomy explorer

`web/index.html`, `web/style.css`, `web/app.js`, and `web/skeleton.js` provide the full-screen introduction, eight-region explorer, bone search/selection, fixed views, model rotation/zoom, and evaluation interface. The page attempts to load the [Écorché GLB](https://github.com/Charleeh/ecorche) as a **candidate preview**. Its published source describes 198 bone meshes and no rig or animation clips; it cannot satisfy the 206-mesh or slow walking completion criteria. The page therefore uses a static pose and a labeled fallback if the model or Three.js cannot load. Candidate mesh matches use source names and are shown as pending review; they never populate the validated `mesh_id` or fracture mapping contract.

The anatomy panel displays verified inventory fields and explicitly leaves structural descriptions, functions, articulations, and terminology pending source review. The browser previews PNG/JPEG pixels locally and the API validates uploaded files; DICOM image preview awaits de-identification. Fracture findings and 3D markers stay gated.

## Anatomy contract

IDs are lowercase snake case, with `left_` or `right_` prefixes for paired bones. The loader asserts skull 22, ossicles 6, hyoid 1, vertebral column 26, thoracic cage 25, pectoral girdle 4, upper limb long bones 6, hands/wrists 54, pelvic girdle 2, lower limb long bones 8, and feet/ankles 52. It fails on any subtotal or laterality mismatch. This matches the [MedlinePlus adult 206-bone reference](https://medlineplus.gov/ency/imagepages/9065.htm); sesamoids and individual variation are outside this convention. The inventory has **not** yet been matched to named meshes or reviewed by an anatomist.

The global skeleton frame is right handed in millimetres: +X subject left, +Y anterior, +Z superior. Its origin is an asset-defined pelvic reference and is currently null. Local frame definitions are anatomical; numeric origins, transforms, landmarks, and mesh coordinates remain null pending mesh registration. A left/right naming check is implemented. Joint topology and proportions must be checked after a source mesh is chosen.

Image boxes are normalized `[x,y,w,h]` on the displayed image, origin top left, +X right and +Y down, with no implicit flips. Pixel spacing is null unless available in DICOM metadata. Mode A assigns an approximate bone subregion only; `position_3d` remains null. The UI displays no 3D skeleton until reviewed geometry is integrated.

## Release gates

The selected source candidate is [Écorché](https://github.com/Charleeh/ecorche), based on [Z-Anatomy](https://www.spi-inc.org/projects/z-anatomy/). Its published mesh license is CC BY-SA 4.0. The exact mesh package, per-bone correspondence, attribution, share-alike obligations, and anatomy review must be recorded before loading it. [GRAZPEDWRI-DX](https://figshare.com/articles/dataset/GRAZPEDWRI-DX/14825193) is the selected primary **pediatric** wrist dataset; Figshare lists CC BY 4.0. Use its actual labels, verify patient IDs and splits, annotation semantics, and population limits before training. FracAtlas is a possible later secondary set and must receive a separate label and license review. No dataset or pretrained weights are included here.

Each analysis response includes a status for every inventory bone. CT-only bones are `not_assessable` on X-ray; remaining bones stay `not_supported` with unknown visibility until a validated bone identification model runs. A per-region analyzer returns explicit bone observations, fracture assessments, and linked findings. For each region, register an analyzer only after training, held-out patient-level validation, localization evaluation, calibration, subgroup and false-negative review, and a versioned report. The current registry is intentionally empty. DICOM preview/de-identification, access control, encrypted persistence, audit logging, clinician feedback storage, 3D mesh binding and markers, multi-view registration, and CT reconstruction remain gated. Uploaded bytes are not persisted by this scaffold.

## Image-to-bone research annotation

After processing a study with known laterality, choose the bone and registered sub-region in Research annotation. Optionally mark a box by dragging on the image, then add the unreviewed finding. Selecting the finding or image overlay highlights its bone in the linked rotatable 3D atlas. This is an operator annotation workflow; it does not enable a trained detector. All model scores and patient-specific 3D geometry remain null. Review choices and multiple annotations can be exported as JSON and otherwise remain in browser session memory. See `docs/IMAGE_TO_BONE_REVIEW.md` for the implementation audit and remaining release requirements.

Run annotation contract tests with `npm run test:findings`.

## Illustrative broken-bone view

Select an annotation for a shaft bone, then choose **Show illustrative break**. This cuts a floating-point copy of the source atlas bone into two capped fragments. Drag to rotate; scroll to zoom. Controls change the schematic cut position, separation, fragment angle and plane tilt. **Atlas bone** restores the intact reference. Orange caps are artificial cut surfaces. No API key is needed.

This mode is explicitly illustrative, not reconstructed from the X-ray. Its display settings are exported separately under `illustrative_preview`; the clinical mapping and confidence remain null. Currently supported: single-mesh upper-limb shaft bones, femur/tibia/fibula, metacarpals and metatarsals. The cut must form one closed contour. Geometry tests: `npm run test:schematic`.

## Context and body transition

Illustrative splits of hand/wrist and foot/ankle bones show neighboring atlas bones on the same side. Long bones default to isolation. **Transition to full skeleton** animates the camera outward in the same scene; **Focus fracture** brings the camera back while keeping the full skeleton present. **Local context** returns to the hand/foot group or the isolated long bone. Full-body wheel zoom moves toward the selected fracture region. The intact source bone is excluded from that scene, so it cannot conceal the gap. The cut persists as geometry at every zoom, subject to normal screen resolution at a distance.

Context meshes are copied into the same reversible display frame as the selected bone. No fracture settings are converted into patient coordinates. Run `npm run test:context` for context/laterality, registration round-trip, splitting and evidence-contract tests.

## Approved FracAtlas development

FracAtlas research use is approved. Acquisition attempts and null evidence fields are recorded in `data/fracatlas/provenance.json`. The official download endpoints currently return HTTP 403 from this environment; no archive or weights have been obtained. The published source describes broad body-region and fracture-localization annotations. Patient grouping and exact bone/side/landmark labels must be inspected in the acquired archive and must not be inferred from image IDs.

When the archive is available, run `.venv/Scripts/python.exe tools/prepare_fracatlas.py <path-to-FracAtlas.zip>`. The audit reads metadata without extracting images, reports actual source counts, and flags missing patient grouping and bone labels. Optionally supply a verified `--patients mapping.csv` with `image_id,patient_id`. This audit does not train or release a detector. Image-level splits cannot satisfy the patient-level release gate. Approximately 1.48 GB of disk space was available during this check; plan storage for the training runtime and artifacts before installing large packages.
