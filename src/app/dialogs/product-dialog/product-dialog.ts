import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../services/product.service';
import { SubcategoryService, Subcategory } from '../../services/subcategory.service';

export interface ProductDialogData {
  product: Product | null;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-product-dialog',
  standalone: false,
  templateUrl: './product-dialog.html',
  styleUrl: './product-dialog.css',
})
export class ProductDialog implements OnInit {
  productForm: FormGroup;
  mode: 'create' | 'edit';
  isEditMode: boolean;

  subcategories: Subcategory[] = [];
  loadingSubcategories = false;

  constructor(
    public dialogRef: MatDialogRef<ProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
    private fb: FormBuilder,
    private subcategoryService: SubcategoryService
  ) {
    this.mode = data.mode;
    this.isEditMode = data.mode === 'edit';
    
    this.productForm = this.fb.group({
      id: [data.product?.id || 0],
      name: [data.product?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [data.product?.description || '', [Validators.required]],
      price: [data.product?.price || 0, [Validators.required, Validators.min(0)]],
      stock: [data.product?.stock || 0, [Validators.required, Validators.min(0)]],
      subcategoryId: [data.product?.subcategoryId || null, [Validators.required]],
      subcategoryName: [data.product?.subcategoryName || ''],
      isDeleted: [data.product?.isDeleted || false],
    });
  }

  ngOnInit(): void {
    this.loadSubcategories();
  }

  loadSubcategories(): void {
    this.loadingSubcategories = true;
    this.subcategoryService.getAllSubcategories()
      .subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories;
          this.loadingSubcategories = false;
          // If editing and subcategoryId is set, ensure it's valid
          if (this.isEditMode && this.data.product?.subcategoryId) {
            const exists = subcategories.find(s => s.id === this.data.product!.subcategoryId);
            if (!exists) {
              // If the current subcategoryId is not in the list, the API might not have a list endpoint
              // In that case, we'll just keep the ID and let the select show empty
            }
          }
        },
        error: (err) => {
          console.error('Error loading subcategories:', err);
          this.loadingSubcategories = false;
        }
      });
  }

  onConfirm(): void {
    if (this.productForm.valid) {
      this.dialogRef.close(this.productForm.value);
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get name() {
    return this.productForm.get('name');
  }

  get description() {
    return this.productForm.get('description');
  }

  get price() {
    return this.productForm.get('price');
  }

  get stock() {
    return this.productForm.get('stock');
  }

  get subcategoryId() {
    return this.productForm.get('subcategoryId');
  }
}
