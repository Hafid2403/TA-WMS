import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_NAME = 'PT. Electra Persada Utama';
const SYSTEM_NAME = 'Warehouse Management System';
const PRIMARY_COLOR = [0, 194, 203];
const DARK_COLOR = [30, 30, 46];
const MUTED_COLOR = [120, 120, 140];

/**
 * Render standard company header block with branding line.
 * @returns {number} Y cursor position after header
 */
function renderHeader(doc, title, docNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand bar
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text(COMPANY_NAME, 14, 20);

  // System subtitle
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_COLOR);
  doc.text(SYSTEM_NAME, 14, 26);

  // Document title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text(title, 14, 38);

  // Document number
  if (docNumber) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_COLOR);
    doc.text(docNumber, 14, 44);
  }

  // Separator line
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, 48, pageWidth - 14, 48);

  return 54;
}

/**
 * Render metadata key-value pairs in a two-column grid layout.
 * @param {Array<{label: string, value: string}>} fields
 * @returns {number} Y cursor position after metadata
 */
function renderMetadata(doc, fields, startY) {
  let y = startY;
  const colWidth = 90;
  let maxRowHeight = 0;
  let currentColumn = 0;

  fields.forEach((field) => {
    if (field.fullWidth) {
      // If we are currently in column 1 (second column), flush the row first
      if (currentColumn === 1) {
        y += maxRowHeight;
        maxRowHeight = 0;
        currentColumn = 0;
      }

      const x = 14;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED_COLOR);
      doc.text(field.label, x, y);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK_COLOR);

      // Split text to fit inside the full page width safely (182 units)
      const lines = doc.splitTextToSize(String(field.value || '-'), 182);
      lines.forEach((line, index) => {
        doc.text(line, x, y + 5 + (index * 4.5));
      });

      const fieldHeight = 5 + (lines.length * 4.5) + 4;
      y += fieldHeight;
      currentColumn = 0;
      maxRowHeight = 0;
    } else {
      const col = currentColumn;
      const x = 14 + col * colWidth;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED_COLOR);
      doc.text(field.label, x, y);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK_COLOR);

      // Split text to fit inside the column width safely
      const lines = doc.splitTextToSize(String(field.value || '-'), 82);
      lines.forEach((line, index) => {
        doc.text(line, x, y + 5 + (index * 4.5));
      });

      const fieldHeight = 5 + (lines.length * 4.5) + 4;
      if (fieldHeight > maxRowHeight) {
        maxRowHeight = fieldHeight;
      }

      if (col === 1) {
        y += maxRowHeight;
        maxRowHeight = 0;
        currentColumn = 0;
      } else {
        currentColumn = 1;
      }
    }
  });

  // Handle remaining unflushed row if any
  if (currentColumn === 1) {
    y += maxRowHeight;
  }

  return y + 4;
}

/**
 * Render page footer with generation timestamp and page numbers.
 */
function renderFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const timestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`Generated: ${timestamp}`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

    // Bottom bar
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');
  }
}

/**
 * Format date string to Indonesian locale.
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Render signature blocks at the bottom of the document.
 */
function renderSignatures(doc, leftLabelOrColumns, leftNameOrStartY, rightLabel, rightName, startY) {
  if (Array.isArray(leftLabelOrColumns)) {
    const columns = leftLabelOrColumns;
    const startYPos = leftNameOrStartY;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let y = startYPos;
    if (pageHeight - y < 55) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;
    
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    
    y += 10;

    const count = columns.length;
    if (count === 0) return y;

    const printableWidth = pageWidth - 28;
    const colWidth = printableWidth / count;

    columns.forEach((col, index) => {
      const x = 14 + (index * colWidth) + 6;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...MUTED_COLOR);
      doc.text(col.label || '', x, y);
      
      doc.setDrawColor(...MUTED_COLOR);
      doc.setLineWidth(0.5);
      const lineWidth = colWidth - 12;
      doc.line(x, y + 20, x + lineWidth, y + 20);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK_COLOR);
      const displayName = col.name ? `${col.name} (${col.title})` : `( ${col.title || '_________________'} )`;
      
      const splitName = doc.splitTextToSize(displayName, lineWidth);
      splitName.forEach((line, lineIdx) => {
        doc.text(line, x, y + 25 + (lineIdx * 4));
      });
    });
    
    return y + 30;
  }

  // Original fallback rendering
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let y = startY;
  if (pageHeight - y < 55) {
    doc.addPage();
    y = 20;
  }
  
  y += 10;
  
  doc.setDrawColor(220, 220, 225);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  
  y += 10;
  
  // Left column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_COLOR);
  doc.text(leftLabelOrColumns, 20, y);
  
  doc.setDrawColor(...MUTED_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, y + 20, 75, y + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text(leftNameOrStartY || '( _________________ )', 20, y + 25);
  
  // Right column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_COLOR);
  doc.text(rightLabel, pageWidth - 75, y);
  
  doc.line(pageWidth - 75, y + 20, pageWidth - 20, y + 20);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_COLOR);
  doc.text(rightName || '( _________________ )', pageWidth - 75, y + 25);
  
  return y + 30;
}

// =====================================================================
// MODULE EXPORTERS
// =====================================================================

/**
 * Generate and download Stock Opname audit session PDF.
 */
export function exportStockOpnamePdf(session, customSignatures = null) {
  const doc = new jsPDF();

  const y = renderHeader(doc, 'Laporan Stock Opname', session.opname_number || `Session #${session.opname_id}`);

  const metaY = renderMetadata(doc, [
    { label: 'Warehouse', value: session.warehouse?.warehouse_name },
    { label: 'Status', value: (session.status || '').toUpperCase() },
    { label: 'Tanggal Mulai', value: formatDate(session.start_date) },
    { label: 'Tanggal Selesai', value: formatDate(session.end_date) },
    { label: 'Pelaksana', value: session.conductor?.name },
    { label: 'Disetujui Oleh', value: session.approver?.name || '-' },
    { label: 'Catatan', value: session.notes || '-', fullWidth: true },
  ], y);

  // Items table
  const tableHeaders = [['No', 'Produk', 'Kategori', 'Lokasi', 'Qty Sistem', 'Qty Fisik', 'Selisih', 'Catatan']];
  const tableRows = (session.items || []).map((item, i) => {
    const sysQty = item.system_qty ?? 0;
    const physQty = item.physical_qty ?? 0;
    const diff = physQty - sysQty;
    
    // Retrieve stock location from product's stocks matching warehouse_id
    const productStock = item.product?.stocks?.find(s => s.warehouse_id === session.warehouse_id);
    const location = productStock 
      ? [productStock.zone, productStock.rack, productStock.bin].filter(Boolean).join('-') 
      : 'Staging';

    return [
      i + 1,
      item.product?.product_name || '-',
      item.product?.category?.category_name || '-',
      location,
      sysQty,
      physQty,
      diff > 0 ? `+${diff}` : diff,
      item.notes || '',
    ];
  });

  autoTable(doc, {
    startY: metaY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable?.finalY || metaY;
  if (customSignatures && customSignatures.length > 0) {
    renderSignatures(doc, customSignatures, finalY);
  } else {
    renderSignatures(
      doc,
      'Pelaksana (Conductor)',
      session.conductor?.name,
      'Pimpinan / Atasan (Approver)',
      session.approver?.name || 'Belum Disetujui',
      finalY
    );
  }

  renderFooter(doc);

  const safeOpnameId = String(session.opname_id || 'report').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `StockOpname_${safeOpnameId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Helper to calculate the dynamic QC status of a Goods Receipt based on its items.
 */
function getGoodsReceiptQCStatus(receipt) {
  if (!receipt.items || receipt.items.length === 0) return 'PENDING QC';
  const statuses = receipt.items.map(item => (item.qc_status || '').toLowerCase());
  if (statuses.every(s => s === 'passed')) return 'COMPLETED';
  if (statuses.every(s => s === 'rejected')) return 'REJECTED';
  if (statuses.some(s => s === 'passed' || s === 'partial' || s === 'rejected')) return 'PARTIAL';
  return 'PENDING QC';
}

/**
 * Generate and download Goods Receipt PDF.
 */
export function exportGoodsReceiptPdf(receipt, customSignatures = null) {
  const doc = new jsPDF();

  const poSub = receipt.purchase_order?.po_number || receipt.po_number || '-';
  const y = renderHeader(doc, 'Laporan Penerimaan Barang', poSub);

  const metaY = renderMetadata(doc, [
    { label: 'GR Number', value: receipt.gr_number },
    { label: 'Tanggal Penerimaan', value: formatDate(receipt.receipt_date) },
    { label: 'Vendor', value: receipt.vendor?.vendor_name },
    { label: 'Warehouse', value: receipt.warehouse?.warehouse_name },
    { label: 'Diterima Oleh', value: receipt.receiver?.name },
    { label: 'Status QC', value: getGoodsReceiptQCStatus(receipt) },
    { label: 'Catatan', value: receipt.notes || '-', fullWidth: true },
  ], y);

  const tableHeaders = [['No', 'Produk', 'Kode Internal', 'Kode Vendor', 'Qty Diterima', 'Qty Diterima QC', 'Qty Ditolak QC', 'Status QC', 'Catatan QC']];
  const tableRows = (receipt.items || []).map((item, i) => {
    const vendorCode = item.vendor_product?.vendor_product_code || item.vendor_product_code || '-';

    return [
      i + 1,
      item.product?.product_name || '-',
      item.product?.internal_code || '-',
      vendorCode,
      item.qty_received ?? 0,
      item.qty_accepted ?? 0,
      item.qty_rejected ?? 0,
      (item.qc_status || 'PENDING').toUpperCase(),
      item.qc_notes || '-',
    ];
  });

  autoTable(doc, {
    startY: metaY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable?.finalY || metaY;
  if (customSignatures && customSignatures.length > 0) {
    renderSignatures(doc, customSignatures, finalY);
  } else {
    renderSignatures(
      doc,
      'Penerima (Receiver)',
      receipt.receiver?.name,
      'Pimpinan / Kepala Gudang',
      'Master Warehouse',
      finalY
    );
  }

  renderFooter(doc);

  const safeGrNumber = String(receipt.gr_number || 'report').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `GoodsReceipt_${safeGrNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generate and download Material Request PDF.
 */
export function exportMaterialRequestPdf(request, customSignatures = null) {
  const doc = new jsPDF();

  const y = renderHeader(doc, 'Laporan Permintaan Material', request.mr_number);

  const metaY = renderMetadata(doc, [
    { label: 'MR Number', value: request.mr_number },
    { label: 'Tanggal Permintaan', value: formatDate(request.request_date) },
    { label: 'Diminta Oleh', value: request.requested_by },
    { label: 'Departemen', value: request.department?.department_name },
    { label: 'Warehouse', value: request.warehouse?.warehouse_name },
    { label: 'Status', value: (request.status || '').toUpperCase() },
    { label: 'Disetujui Oleh', value: request.approver?.name || '-' },
    { label: 'Catatan', value: request.notes || '-', fullWidth: true },
  ], y);

  const tableHeaders = [['No', 'Produk', 'Kode Internal', 'Lokasi', 'Satuan', 'Qty Diminta', 'Qty Terpenuhi', 'Catatan Item']];
  const tableRows = (request.items || []).map((item, i) => {
    // Retrieve stock location from product's stocks matching warehouse_id
    const productStock = item.product?.stocks?.find(s => s.warehouse_id === request.warehouse_id);
    const location = productStock 
      ? [productStock.zone, productStock.rack, productStock.bin].filter(Boolean).join('-') 
      : 'Staging';

    return [
      i + 1,
      item.product?.product_name || '-',
      item.product?.internal_code || '-',
      location,
      item.product?.unit || 'pcs',
      item.qty_requested ?? 0,
      item.qty_fulfilled ?? 0,
      item.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: metaY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 18, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable?.finalY || metaY;
  if (customSignatures && customSignatures.length > 0) {
    renderSignatures(doc, customSignatures, finalY);
  } else {
    renderSignatures(
      doc,
      'Pemohon (Requested By)',
      request.requested_by,
      'Persetujuan / Supervisor',
      request.approver?.name || 'Belum Disetujui',
      finalY
    );
  }

  renderFooter(doc);

  const safeMrNumber = String(request.mr_number || 'report').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `MaterialRequest_${safeMrNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generate and download Putaway Location Shelf Label (80x50 mm Landscape).
 */
export function exportPutawayLabelPdf(rakGroup) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [80, 50]
  });

  // Border & Padding
  doc.setDrawColor(30, 30, 46);
  doc.setLineWidth(0.5);
  doc.rect(2, 2, 76, 46);

  // Location Code
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 79, 219); // Royal blue
  const locStr = `ZONE ${rakGroup.zone} - RACK ${rakGroup.rack} - BIN ${rakGroup.bin}`;
  doc.text(locStr, 38, 8.5, { align: 'center' });

  // Warehouse Target
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 46);
  doc.text(`Warehouse: ${rakGroup.warehouse_name}`, 38, 12.5, { align: 'center' });

  // Extract unique products
  const uniqueProducts = Array.from(new Set(rakGroup.items.map(it => it.product?.product_name || 'Product')));

  const itemsPerPage = 5;
  for (let i = 0; i < uniqueProducts.length; i += itemsPerPage) {
    if (i > 0) {
      doc.addPage([80, 50], 'landscape');
      // Draw border for the new page
      doc.setDrawColor(30, 30, 46);
      doc.setLineWidth(0.5);
      doc.rect(2, 2, 76, 46);

      // Location Code
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 79, 219); // Royal blue
      const locStr = `ZONE ${rakGroup.zone} - RACK ${rakGroup.rack} - BIN ${rakGroup.bin}`;
      doc.text(locStr, 38, 8.5, { align: 'center' });

      // Warehouse Target
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 46);
      doc.text(`Warehouse: ${rakGroup.warehouse_name}`, 38, 12.5, { align: 'center' });
    }

    // Draw separator line
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.3);
    doc.line(5, 15, 75, 15);

    // Products on this Location
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 46);
    doc.setFontSize(7.5);
    let y = 20;
    const pageProducts = uniqueProducts.slice(i, i + itemsPerPage);
    pageProducts.forEach(prodName => {
      const displayStr = prodName.length > 45 ? prodName.substring(0, 42) + '..' : prodName;
      doc.text(`• ${displayStr}`, 5, y);
      y += 4.5;
    });

    // Timestamp
    doc.setFontSize(5);
    doc.setTextColor(120, 120, 140);
    const nowStr = new Date().toLocaleString('id-ID');
    doc.text(`Generated: ${nowStr}`, 75, 46, { align: 'right' });
  }

  const filename = `Label_Shelf_${rakGroup.warehouse_name}_${rakGroup.zone}_${rakGroup.rack}_${rakGroup.bin}.pdf`;
  doc.save(filename);
}

