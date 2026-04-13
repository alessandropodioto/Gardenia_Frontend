import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  
  // 1. ECCO DOVE ANDAVA: abbiamo sostituito la vecchia variabile con l'array
  imageToDeleteIds: number[] = []; 

  constructor(
    public dialogRef: MatDialogRef<ProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
    private fb: FormBuilder,
    private subcategoryService: SubcategoryService,
    private cdr: ChangeDetectorRef
  ) {
    this.mode = data.mode;
    this.isEditMode = data.mode === 'edit';
    
    // Inizializza il form
    this.productForm = this.fb.group({
      id: [data.product?.id || 0],
      name: [data.product?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [data.product?.description || '', [Validators.required]],
      price: [data.product?.price || 0, [Validators.required, Validators.min(0)]],
      stock: [data.product?.stock || 0, [Validators.required, Validators.min(0)]],
      subcategoryId: [data.product?.subcategoryId || null, [Validators.required]],
      subcategoryName: [data.product?.subcategoryName || ''],
      isDeleted: [data.product?.isDeleted || false],
      imageUrls: [''] 
    });
  }

  ngOnInit(): void {
    this.loadSubcategories();

    if (this.isEditMode && this.data.product?.images && this.data.product.images.length > 0) {
        // Prende tutti i link dal database e li unisce con un "a capo" (\n)
        const savedLinks = this.data.product.images.map((img: any) => img.link).join('\n');
        this.productForm.patchValue({ imageUrls: savedLinks });
        
        // 2. MODIFICA: Salviamo la lista degli ID da eliminare usando il nuovo array
        this.imageToDeleteIds = this.data.product.images.map((img: any) => img.imageId || img.id);
    }
  }

  loadSubcategories(): void {
    setTimeout(() => {
      this.loadingSubcategories = true;
      this.subcategoryService.getAllSubcategories().subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories;
          this.loadingSubcategories = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading subcategories:', err);
          this.loadingSubcategories = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  onConfirm(): void {
    if (this.productForm.valid) {
      const finalProductData = {
         ...this.productForm.value,
         id: this.data.product?.id
      };
      
      // 3. MODIFICA: Corretto il console log per leggere 'imageUrls' al plurale
      console.log("LINK CHE STO PASSANDO ALL'ADMIN:", this.productForm.value.imageUrls);

      // Chiude la modale e passa i dati ad admin.ts
      this.dialogRef.close({
        productData: finalProductData,
        imageUrls: this.productForm.value.imageUrls,
        // 4. MODIFICA: Passiamo il nuovo array all'admin
        deletedImageIds: this.imageToDeleteIds
      });
    } else {
      this.productForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  get name() { return this.productForm.get('name'); }
  get description() { return this.productForm.get('description'); }
  get price() { return this.productForm.get('price'); }
  get stock() { return this.productForm.get('stock'); }
  get subcategoryId() { return this.productForm.get('subcategoryId'); }
}