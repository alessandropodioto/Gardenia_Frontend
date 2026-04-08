import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core'; // AGGIUNTO ChangeDetectorRef QUI
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

  selectedFile: File | null = null;
  fileName: string = '';
  imagePreview: string | null = null;
  imageToDeleteId: number | null = null;
  constructor(
    public dialogRef: MatDialogRef<ProductDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
    private fb: FormBuilder,
    private subcategoryService: SubcategoryService,
    private cdr: ChangeDetectorRef // AGGIUNTO QUI NEL COSTRUTTORE
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

    if (this.isEditMode && this.data.product?.images && this.data.product.images.length > 0) {
        const savedFileName = this.data.product.images[0].link;
        this.imagePreview = 'http://localhost:8080/uploads/' + savedFileName; 
    }
  }

 // 1. MODIFICA QUESTA FUNZIONE PER RISOLVERE L'ERRORE ROSSO
  loadSubcategories(): void {
    // Il setTimeout "calma" Angular e gli dà il tempo di aggiornare la grafica
    setTimeout(() => {
      this.loadingSubcategories = true;
      this.subcategoryService.getAllSubcategories().subscribe({
        next: (subcategories) => {
          this.subcategories = subcategories;
          this.loadingSubcategories = false;
          this.cdr.detectChanges(); // Diciamo ad Angular di aggiornarsi
        },
        error: (err) => {
          console.error('Error loading subcategories:', err);
          this.loadingSubcategories = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  // 2. AGGIUNGI QUESTA NUOVA FUNZIONE (sotto a onFileSelected)
  removeImage(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.imagePreview = null;
    
    // Salviamo l'ID dell'immagine nel DB (usiamo 'any' per evitare problemi con i nomi del DTO Java)
    if (this.isEditMode && this.data.product?.images && this.data.product.images.length > 0) {
      const imgData: any = this.data.product.images[0];
      this.imageToDeleteId = imgData.imageId || imgData.id; 
    }
    
    this.cdr.detectChanges();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.fileName = this.selectedFile.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        
        // AGGIUNGI QUESTA RIGA PER RISOLVERE L'ERRORE ROSSO
        this.cdr.detectChanges(); 
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onConfirm(): void {
    if (this.productForm.valid) {
      // Includiamo l'ID del prodotto nei dati del form
      const finalProductData = {
         ...this.productForm.value,
         id: this.data.product?.id
      };

      this.dialogRef.close({
        productData: finalProductData,
        file: this.selectedFile,
        deletedImageId: this.imageToDeleteId // <-- Passiamo l'ID da cancellare ad admin.ts!
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