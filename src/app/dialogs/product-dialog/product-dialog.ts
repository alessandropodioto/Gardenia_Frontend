/**
 * PRODUCT DIALOG
 * ─────────────────────────────────────────────────────────────────────────────
 * Dialog riusabile per creare o modificare un prodotto (usato dall'Admin).
 * In modalità "edit" il form viene prepopolato e i link delle immagini esistenti
 * vengono caricati nel campo imageUrls per permetterne la modifica.
 *
 * GESTIONE IMMAGINI:
 * Le immagini non vengono caricate come file ma come URL (link).
 * Il campo imageUrls è una stringa dove ogni URL è separato da un newline (\n).
 * Al salvataggio, Admin:
 *   1. In modalità edit: elimina prima le immagini vecchie (forkJoin), poi carica le nuove
 *   2. In modalità create: carica le nuove immagini dopo aver creato il prodotto
 * Il dialog restituisce { productData, imageUrls, deletedImageIds } ad Admin.
 *
 * Il campo imageUrls viene prefillato con i link esistenti in modalità edit;
 * imageToDeleteIds contiene gli ID delle immagini da rimuovere (le esistenti).
 */

import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Product } from '../../services/product.service';
import { SubcategoryService, Subcategory } from '../../services/subcategory.service';

export interface ProductDialogData {
  product: Product | null; // null = modalità creazione; Product = modalità modifica
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

  subcategories: Subcategory[] = [];  // Lista per il <mat-select> sottocategoria
  loadingSubcategories = false;

  // ID delle immagini esistenti da eliminare prima di salvare le nuove (solo in edit)
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

    // Inizializza il form con i valori del prodotto esistente (edit) o vuoti (create)
    // data.product?.name: l'operatore ?. evita errori se product è null
    this.productForm = this.fb.group({
      id:              [data.product?.id || 0],
      name:            [data.product?.name || '',            [Validators.required, Validators.minLength(3)]],
      description:     [data.product?.description || '',     [Validators.required]],
      price:           [data.product?.price || 0,            [Validators.required, Validators.min(0)]],
      stock:           [data.product?.stock || 0,            [Validators.required, Validators.min(0)]],
      subcategoryId:   [data.product?.subcategoryId || null, [Validators.required]],
      subcategoryName: [data.product?.subcategoryName || ''],
      isDeleted:       [data.product?.isDeleted || false],
      imageUrls:       [''] // Stringa con URL separati da \n; popolata in ngOnInit se edit
    });
  }

  ngOnInit(): void {
    this.loadSubcategories();

    if (this.isEditMode && this.data.product?.images && this.data.product.images.length > 0) {
      // Prefill campo imageUrls con i link esistenti (uno per riga)
      // In questo modo l'admin può vedere e modificare i link correnti
      const savedLinks = this.data.product.images.map((img: any) => img.link).join('\n');
      this.productForm.patchValue({ imageUrls: savedLinks });
      // patchValue() aggiorna solo i campi specificati (a differenza di setValue() che richiede tutti)

      // Salviamo gli ID delle immagini esistenti: Admin le eliminerà prima di caricare le nuove
      this.imageToDeleteIds = this.data.product.images.map((img: any) => img.imageId || img.id);
    }
  }

  /** Carica tutte le sottocategorie per il select del form */
  loadSubcategories(): void {
    // setTimeout(...) senza delay: posticipa al microtask successivo per evitare
    // ExpressionChangedAfterItHasBeenChecked (Angular NG0100) durante il bootstrap del dialog
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

  /**
   * Chiude il dialog passando ad Admin tutti i dati necessari per il salvataggio:
   * - productData: i campi del prodotto (da inviare al backend)
   * - imageUrls: stringa con i link delle immagini (Admin la parsificherà)
   * - deletedImageIds: ID delle immagini da eliminare (solo in edit con nuovi URL)
   */
  onConfirm(): void {
    if (this.productForm.valid) {
      // Spread + override id: garantisce che l'id del prodotto esistente venga preservato
      const finalProductData = {
        ...this.productForm.value,
        id: this.data.product?.id
      };

      // Chiude il dialog e passa l'oggetto risultato ad Admin
      this.dialogRef.close({
        productData: finalProductData,
        imageUrls: this.productForm.value.imageUrls,
        deletedImageIds: this.imageToDeleteIds
      });
    } else {
      // Marca tutti i campi come "touched" per far apparire i messaggi di errore
      this.productForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // ── Getter per i FormControl ────────────────────────────────────────────
  get name()          { return this.productForm.get('name'); }
  get description()   { return this.productForm.get('description'); }
  get price()         { return this.productForm.get('price'); }
  get stock()         { return this.productForm.get('stock'); }
  get subcategoryId() { return this.productForm.get('subcategoryId'); }
}
