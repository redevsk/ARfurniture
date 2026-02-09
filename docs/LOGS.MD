# Session Logs: 2026-02-09

## 1. Product Variant Management Refinement
- **Feature**: Enabled editing of existing product variants.
- **Frontend Changes (`ProductManager.tsx`)**:
    - Introduced `editingVariantId` state for edit mode tracking.
    - Updated `handleAddVariant` to handle updates via `setVariants(prev => prev.map(...))`.
    - Added `handleEditVariant` which populates the form and scrolls to it.
    - Added `cancelEditVariant` to reset the form.
    - Updated UI:
        - Two-row layout for variant fields (Name/Stock/Color in row 1, Image/Model in row 2).
        - Edit button added to each variant in the list.
        - Highlighting active variant being edited.
        - Dynamic button icons (Plus vs Save) and labels (Add vs Update).
        - **Asset Status Preview**: Added a small thumbnail of the variant's current/new image in the form header.
- **Backend Changes (`server/index.mjs`)**:
    - Updated product update logic to correctly handle `variants` and `images` arrays.

## 2. Customer Experience Optimization
- **Persistent View Mode (`ProductDetail.tsx`)**:
    - Modified variant selection to **persist the 3D View**. If a user is viewing a product in 3D, changing the color/variant will keep them in the 3D viewer instead of switching back to the static image.
- **UI Bug Fixes**:
    - Removed `overflow-hidden` on variant color swatches to allow color name labels (tooltips) to be visible.

## 3. Supabase Storage Infrastructure Restructuring
- **Folder Organization**:
    - Refined the directory structure to be product-centric and variant-aware:
        - Main Assets: `{productName}/main/{images|model}/{filename}`
        - Variant Assets: `{productName}/{variantName}/{images|model}/{filename}`
        - Additional Images: `{productName}/additional-images/{filename}`
- **Backend Logic Refinement**:
    - Renamed internal `gallery` references to `additional-images` for consistency.
    - **Automatic File Cleanup**:
        - When a variant's image or 3D model is updated, the server **automatically deletes the old version** from Supabase.
    - **Folder-Level Purging & Logging**:
        - Deleting a variant now automatically **purges its entire directory** in storage using robust recursive listing (`recursive: true`) to ensure no orphan files remain.
        - Deleting a product now triggers a **complete purge of the product's root directory**, recursively removing all subfolders in a single pass.
        - Added verbose server logging (`[STORAGE] 🗑️`) to track deletion success and help with storage diagnostics.
- **Upload API Enhancement**:
    - Updated upload endpoints to support a `variantName` query parameter for organized steering of assets.
- **Documentation**:
    - Completely updated `docs/SUPABASE_SETUP.md` to reflect the new architecture.

## 4. Instant Variant Persistence & Deletion (UX Improvement)
**Date**: 2026-02-09 14:30

### Problem
Previously, variants were only saved to the database when the user clicked "Update Product". This meant:
- Adding a variant → Files uploaded to Supabase → **NOT saved to DB** until product save
- Deleting a variant → Removed from UI → **Files NOT deleted from Supabase** until product save
- Poor UX: Users had to remember to save the product after every variant change

### Solution
Implemented **instant persistence** for variant operations:

#### Frontend Changes (`ProductManager.tsx`)
1. **`handleAddVariant`**:
   - Now immediately saves the product to the database after adding a variant
   - Uploads files → Adds to local state → **Saves to DB instantly**
   - Requires product to be saved first (shows error if `editingId` is null)
   - Updates the products list in real-time

2. **`handleRemoveVariant`**:
   - Changed from synchronous to `async` function
   - Immediately saves the product to the database after removing a variant
   - Triggers backend cleanup logic automatically
   - Updates the products list in real-time

3. **UI Improvements**:
   - Moved "Add Variant" button below the form inputs for better visual hierarchy
   - Button now shows text labels ("Add Variant" / "Update Variant") instead of just icons
   - Full-width button design for better mobile UX

#### Backend Changes (`server/index.mjs`)
1. **Enhanced Logging**:
   - Added `[UPDATE PRODUCT]` logs showing received variants
   - Added `[VARIANT CLEANUP]` logs showing old vs new variants comparison
   - Added `[STORAGE]` logs for file and folder deletion operations
   - Logs now show exact file paths being deleted and operation results

2. **Improved Deletion Logic**:
   - Fixed `deleteSupabaseFolder` function to properly handle nested folders
   - Now correctly deletes both `images/` and `model/` subfolders within variant directories
   - Added comprehensive error handling for non-existent folders
   - Deletion now works for both old structure (`product/variants/variant/`) and new structure (`product/variant/`)

3. **Variant Cleanup Flow**:
   ```
   User deletes variant → Frontend saves product → Backend compares old vs new variants
   → Detects deleted variant → Deletes specific files by URL → Purges variant folder
   → Logs success → Returns updated product
   ```

### Benefits
- ✅ **Instant Feedback**: Variants are immediately persisted when added or deleted
- ✅ **Automatic Cleanup**: Supabase Storage files are deleted immediately when variant is removed
- ✅ **No Orphaned Files**: Comprehensive folder deletion ensures no leftover files in storage
- ✅ **Better UX**: No need to remember to save the product after variant changes
- ✅ **Debugging**: Extensive logging makes it easy to track what's happening in storage operations

### Technical Notes
- Variant operations require an existing product (`editingId` must be set)
- Each variant add/delete triggers a full product update to maintain data consistency
- Backend cleanup runs automatically as part of the product update flow
- Deletion logic handles both file-level (specific URLs) and folder-level (recursive) cleanup
