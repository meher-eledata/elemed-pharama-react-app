// Mock API service for frontend-only development
// This simulates backend API responses

export interface MockReceipt {
  id: number;
  supplier_name: string;
  supplier_id: number;
  po_number: string;
  payment_method: string;
  payment_vendor: string;
  transaction_number: string;
  notes: string;
  created_by: string;
  created_at: string;
  lines: Array<{
    id: number;
    product: string;
    product_id: number;
    received_qty: number;
    free_qty: number;
    expiry_date: string;
    unit_price: number;
    cgst: number;
    sgst: number;
    igst: number;
    discount: number;
  }>;
}

class MockApiService {
  private receipts: MockReceipt[] = [];
  private suppliers: Array<{ id: number; name: string }> = [];
  private nextReceiptId = 1;
  private nextSupplierId = 1;

  // Simulate API delay
  private delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async submitReceipt(payload: any): Promise<{ message: string; receiptId: number }> {
    await this.delay(800); // Simulate network delay

    // Create new supplier if supplier_id is 0
    let supplierId = payload.supplier_id;
    if (supplierId === 0) {
      supplierId = this.nextSupplierId++;
      this.suppliers.push({
        id: supplierId,
        name: payload.supplier_name
      });
    }

    // Create new receipt
    const receipt: MockReceipt = {
      id: this.nextReceiptId++,
      supplier_name: payload.supplier_name,
      supplier_id: supplierId,
      po_number: payload.po_number,
      payment_method: payload.payment_method,
      payment_vendor: payload.payment_vendor,
      transaction_number: payload.transaction_number,
      notes: payload.notes || "",
      created_by: payload.created_by,
      created_at: new Date().toISOString(),
      lines: payload.lines.map((line: any, index: number) => ({
        id: index + 1,
        product: line.product,
        product_id: line.product_id,
        received_qty: line.received_qty,
        free_qty: line.free_qty,
        expiry_date: line.expiry_date,
        unit_price: line.unit_price,
        cgst: line.cgst,
        sgst: line.sgst,
        igst: line.igst,
        discount: line.discount,
      }))
    };

    this.receipts.push(receipt);

    return {
      message: "Receipt submitted successfully",
      receiptId: receipt.id
    };
  }

  async getUniqueSupplierNames(): Promise<Array<{ supplier_name: string; supplier_id: number }>> {
    await this.delay(300);
    return this.suppliers.map(s => ({
      supplier_name: s.name,
      supplier_id: s.id
    }));
  }

  async getProducts(): Promise<string[]> {
    await this.delay(300);
    return [
      "Amoxicillin 250 mg (strip of 10)",
      "Paracetamol 500 mg (strip of 10)",
      "Ibuprofen 400 mg (strip of 10)",
      "Aspirin 75 mg (strip of 10)",
      "Metformin 500 mg (strip of 10)",
      "Omeprazole 20 mg (strip of 10)",
      "Atorvastatin 20 mg (strip of 10)",
      "Lisinopril 10 mg (strip of 10)",
      "Metoprolol 50 mg (strip of 10)",
      "Amlodipine 5 mg (strip of 10)"
    ];
  }

  async getReceipts(): Promise<MockReceipt[]> {
    await this.delay(300);
    return this.receipts;
  }

  async editReceipt(payload: any): Promise<{ message: string; receiptId: number }> {
    await this.delay(800); // Simulate network delay

    // Find the receipt to edit
    const receiptIndex = this.receipts.findIndex(r => r.id === payload.receipt_id);
    if (receiptIndex === -1) {
      throw new Error(`Receipt ${payload.receipt_id} not found`);
    }

    const receipt = this.receipts[receiptIndex];

    // Update receipt basic information
    receipt.supplier_name = payload.supplier_name;
    receipt.supplier_id = payload.supplier_id;
    receipt.po_number = payload.po_number;
    receipt.payment_method = payload.payment_method;
    receipt.payment_vendor = payload.payment_vendor;
    receipt.transaction_number = payload.transaction_number;
    receipt.notes = payload.notes;
    receipt.created_by = payload.created_by;

    // Handle deleted lines
    if (payload.Deleted && payload.Deleted.length > 0) {
      receipt.lines = receipt.lines.filter(line => 
        !payload.Deleted.some((deleted: any) => deleted.receipt_line_id === line.id)
      );
    }

    // Handle edited lines
    if (payload.Edited && payload.Edited.length > 0) {
      payload.Edited.forEach((edited: any) => {
        const lineIndex = receipt.lines.findIndex(line => line.id === edited.receipt_line_id);
        if (lineIndex !== -1) {
          const line = receipt.lines[lineIndex];
          line.product = edited.product_name;
          line.product_id = edited.product_id;
          line.received_qty = edited.received_qty;
          line.free_qty = edited.free_qty;
          line.unit_price = parseFloat(edited.unit_price);
          line.cgst = parseFloat(edited.cgst);
          line.sgst = parseFloat(edited.sgst);
          line.igst = parseFloat(edited.igst);
          line.discount = parseFloat(edited.discount);
        }
      });
    }

    // Handle added lines
    if (payload.Added && payload.Added.length > 0) {
      const maxId = Math.max(...receipt.lines.map(l => l.id), 0);
      payload.Added.forEach((added: any, index: number) => {
        receipt.lines.push({
          id: maxId + index + 1,
          product: added.product,
          product_id: added.product_id,
          received_qty: added.received_qty,
          free_qty: added.free_qty,
          expiry_date: added.expiry_date,
          unit_price: added.unit_price,
          cgst: added.cgst,
          sgst: added.sgst,
          igst: added.igst,
          discount: added.discount,
        });
      });
    }

    return {
      message: "Receipt updated successfully",
      receiptId: receipt.id
    };
  }
}

export const mockApiService = new MockApiService();
