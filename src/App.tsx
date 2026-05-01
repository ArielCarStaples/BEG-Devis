import React, { useState, useEffect } from 'react';
import { Plus, Printer, Trash2, Loader2, Download, Upload, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

interface Item {
  id: number;
  qty: string;
  desc: string;
  price: string;
}

export default function App() {
  const [date, setDate] = useState('');
  const [devis, setDevis] = useState('');

  const [succursale, setSuccursale] = useState('');
  const [sContact, setSContact] = useState('');
  const [sAdresse, setSAdresse] = useState('');
  const [sTel, setSTel] = useState('');
  const [sFax, setSFax] = useState('');
  const [sEmail, setSEmail] = useState('');

  const [cContact, setCContact] = useState('');
  const [cEntreprise, setCEntreprise] = useState('');
  const [cAdresse, setCAdresse] = useState('');
  const [cTel, setCTel] = useState('');
  const [cFax, setCFax] = useState('');
  const [cEmail, setCEmail] = useState('');

  const [instructions, setInstructions] = useState('');

  const [transport, setTransport] = useState('');
  const [taxes, setTaxes] = useState('');

  const [items, setItems] = useState<Item[]>([{ id: Date.now(), qty: '1', desc: '', price: '' }]);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportJSON = () => {
    const data = {
      date, devis, succursale, sContact, sAdresse, sTel, sFax, sEmail,
      cContact, cEntreprise, cAdresse, cTel, cFax, cEmail,
      items, instructions, transport, taxes
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Devis_${devis || 'Nouveau'}.json`);
    dlAnchorElem.click();
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json) {
          if (json.date !== undefined) setDate(json.date);
          if (json.devis !== undefined) setDevis(json.devis);
          if (json.succursale !== undefined) setSuccursale(json.succursale);
          if (json.sContact !== undefined) setSContact(json.sContact);
          if (json.sAdresse !== undefined) setSAdresse(json.sAdresse);
          if (json.sTel !== undefined) setSTel(json.sTel);
          if (json.sFax !== undefined) setSFax(json.sFax);
          if (json.sEmail !== undefined) setSEmail(json.sEmail);
          if (json.cContact !== undefined) setCContact(json.cContact);
          if (json.cEntreprise !== undefined) setCEntreprise(json.cEntreprise);
          if (json.cAdresse !== undefined) setCAdresse(json.cAdresse);
          if (json.cTel !== undefined) setCTel(json.cTel);
          if (json.cFax !== undefined) setCFax(json.cFax);
          if (json.cEmail !== undefined) setCEmail(json.cEmail);
          if (json.items !== undefined) setItems(json.items);
          if (json.instructions !== undefined) setInstructions(json.instructions);
          if (json.transport !== undefined) setTransport(json.transport);
          if (json.taxes !== undefined) setTaxes(json.taxes);

          // Force resize textareas after import
          setTimeout(() => {
            document.querySelectorAll('textarea').forEach((el) => {
              const target = el as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            });
          }, 0);
        }
      } catch (err) {
        alert("Erreur lors de l'importation du fichier JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), qty: '1', desc: '', price: '' }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const totalPartiel = items.reduce((acc, item) => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    if (item.qty || item.desc || item.price) {
      return acc + qty * price;
    }
    return acc;
  }, 0);

  const tTransport = parseFloat(transport) || 0;
  const sousTotal = totalPartiel + tTransport;
  const tTaxes = parseFloat(taxes) || 0;
  const total = sousTotal + tTaxes;

  const validItems = items.filter((item) => item.qty || item.desc || item.price);

  const chunkItems = () => {
    const pages: Item[][] = [];
    let currentPage: Item[] = [];
    let currentHeight = 0;
    
    // Total usable height is around 1000px but we play it very safe by keeping it smaller
    const PAGE_HEIGHT = 800; // Increased safety margin
    const HEADER_HEIGHT = 320; 
    const TABLE_HEADER_HEIGHT = 50;
    const FOOTER_HEIGHT = 300; // Large estimate for footer
    
    validItems.forEach((item, index) => {
      // Estimate height of item
      const charsPerLine = 35;
      const explicitNewlines = (item.desc.match(/\n/g) || []).length;
      const wrappedLines = Math.ceil(item.desc.length / charsPerLine);
      const estimatedLines = explicitNewlines + wrappedLines;
      const itemHeight = Math.max(50, 20 + (estimatedLines * 20)); 
      
      const isFirstPage = pages.length === 0;
      let availableSpace = PAGE_HEIGHT;
      
      if (isFirstPage) {
        availableSpace -= HEADER_HEIGHT;
      }
      availableSpace -= TABLE_HEADER_HEIGHT;
      
      const isLastItem = index === validItems.length - 1;
      let spaceNeeded = itemHeight;
      
      if (isLastItem) {
        spaceNeeded += FOOTER_HEIGHT; // Footer must fit on the last page with the last item
      }
      
      if (currentHeight + spaceNeeded > availableSpace && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      
      currentPage.push(item);
      currentHeight += itemHeight;
    });
    
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    return pages.length > 0 ? pages : [[]];
  };

  const chunkedPages = chunkItems();

  const executeExport = async (withJson: boolean) => {
    setShowExportModal(false);
    
    if (withJson) {
      handleExportJSON();
    }

    try {
      setIsExporting(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      for (let i = 0; i < chunkedPages.length; i++) {
        const element = document.getElementById(`preview-page-${i}`);
        if (!element) continue;
        
        const imgData = await htmlToImage.toPng(element, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          style: { margin: '0', boxShadow: 'none' }
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        
          const imgProps = pdf.getImageProperties(imgData);
          const pdfPageHeight = pdf.internal.pageSize.getHeight();
          let finalImageHeight = (imgProps.height * pdfWidth) / imgProps.width;
          let finalImageWidth = pdfWidth;

          if (finalImageHeight > pdfPageHeight) {
             const scaleRatio = pdfPageHeight / finalImageHeight;
             finalImageWidth = pdfWidth * scaleRatio;
             finalImageHeight = pdfPageHeight;
          }

          pdf.addImage(imgData, 'PNG', (pdfWidth - finalImageWidth) / 2, 0, finalImageWidth, finalImageHeight);
      }
      
      pdf.save(`Devis_${devis || 'Nouveau'}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF', error);
      alert('Erreur lors de la génération du PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDescChange = (id: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateItem(id, 'desc', e.target.value);
    e.target.style.height = 'auto'; // Reset to auto to get the actual scroll height
    e.target.style.height = `${e.target.scrollHeight}px`; // Set to scroll height
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-xl flex flex-col gap-4 w-[400px] relative">
            <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900">Options d'exportation</h3>
            <p className="text-sm text-gray-600">Voulez-vous également sauvegarder les données du devis au format JSON pour pouvoir les réimporter plus tard ?</p>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => executeExport(false)} 
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-bold text-gray-700 transition"
              >
                PDF uniquement
              </button>
              <button 
                onClick={() => executeExport(true)} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold shadow transition"
              >
                PDF + JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App Header */}
      <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6 shrink-0 print:hidden z-20">
        <div className="flex items-center gap-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/50/Logo_Bureau_en_gros_2018.svg"
            alt="Bureau en Gros"
            className="h-6 w-auto"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-lg font-bold tracking-tight ml-1 border-l-2 pl-3 border-gray-200 text-gray-700">Centre de Solutions <span className="text-gray-400 font-normal">/ Devis</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 mr-2 border-r border-gray-200 pr-4">
            <label className="text-gray-400 hover:text-gray-700 cursor-pointer p-2 transition flex items-center gap-1 rounded hover:bg-gray-50" title="Importer JSON">
              <Upload className="h-4 w-4" />
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
            <button onClick={handleExportJSON} className="text-gray-400 hover:text-gray-700 p-2 transition flex items-center gap-1 rounded hover:bg-gray-50" title="Exporter JSON">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2 shadow transition"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            EXPORTER PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible print:h-auto">
        {/* LEFT SIDEBAR: INPUT FORM */}
        <aside id="sidebar" className="w-[320px] bg-white border-r border-gray-300 p-5 overflow-y-auto flex flex-col gap-6 shrink-0 print:hidden z-10 shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
          <div className="space-y-6" id="input-form">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Générateur de Devis</h2>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Ex: 24 Octobre 2023"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1 text-gray-500 uppercase tracking-widest">Devis #</label>
                <input
                  type="text"
                  value={devis}
                  onChange={(e) => setDevis(e.target.value)}
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  placeholder="Ex: 1001"
                />
              </div>
            </div>

            {/* Succursale Info */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Infos Succursale
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={succursale}
                  onChange={(e) => setSuccursale(e.target.value)}
                  placeholder="SUCCURSALE #"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={sContact}
                  onChange={(e) => setSContact(e.target.value)}
                  placeholder="Personne-Contact"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <textarea
                  value={sAdresse}
                  onChange={(e) => setSAdresse(e.target.value)}
                  placeholder="Adresse"
                  rows={2}
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                ></textarea>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={sTel}
                    onChange={(e) => setSTel(e.target.value)}
                    placeholder="Téléphone"
                    className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={sFax}
                    onChange={(e) => setSFax(e.target.value)}
                    placeholder="Télécopieur"
                    className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <input
                  type="email"
                  value={sEmail}
                  onChange={(e) => setSEmail(e.target.value)}
                  placeholder="Courriel"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-2">
                Infos du Client
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={cContact}
                  onChange={(e) => setCContact(e.target.value)}
                  placeholder="Personne-Contact"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={cEntreprise}
                  onChange={(e) => setCEntreprise(e.target.value)}
                  placeholder="Entreprise"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <textarea
                  value={cAdresse}
                  onChange={(e) => setCAdresse(e.target.value)}
                  placeholder="Adresse"
                  rows={2}
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
                ></textarea>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={cTel}
                    onChange={(e) => setCTel(e.target.value)}
                    placeholder="Téléphone"
                    className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={cFax}
                    onChange={(e) => setCFax(e.target.value)}
                    placeholder="Télécopieur"
                    className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
                <input
                  type="email"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  placeholder="Courriel"
                  className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-2">
                Instructions Spéciales
              </h3>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Saisir les instructions spéciales ici..."
                rows={3}
                className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
              ></textarea>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-2 flex justify-between items-center">
                Articles
                <button
                  onClick={addItem}
                  className="text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> AJOUTER
                </button>
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[50px_1fr_60px_30px] gap-2 items-start">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                      className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none text-center"
                      placeholder="Qté"
                    />
                    <textarea
                      value={item.desc}
                      onChange={(e) => handleDescChange(item.id, e)}
                      className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none resize-none overflow-hidden min-h-[40px]"
                      placeholder="Description"
                      rows={1}
                    ></textarea>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      className="w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-2 focus:ring-red-500 focus:outline-none text-right"
                      placeholder="Prix"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 flex justify-center items-center transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid gap-2 text-xs mb-3 text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Transport et Préparation</span>
                  <input
                    type="number"
                    step="0.01"
                    value={transport}
                    onChange={(e) => setTransport(e.target.value)}
                    className="w-24 text-xs border border-gray-300 p-1 rounded bg-white focus:ring-1 focus:ring-red-500 focus:outline-none text-right"
                    placeholder="0.00 $"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxes ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                    className="w-24 text-xs border border-gray-300 p-1 rounded bg-white focus:ring-1 focus:ring-red-500 focus:outline-none text-right"
                    placeholder="0.00 $"
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 text-gray-900 mt-2">
                <span>Total</span>
                <span className="text-red-600">{total > 0 ? total.toFixed(2) : '0.00'} $</span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT SIDE: REAL-TIME PREVIEW */}
        <main id="preview-wrapper" className="flex-1 bg-gray-500 p-8 flex flex-col gap-8 items-center overflow-y-auto print:bg-white print:p-0 print:block print:overflow-visible print:h-auto">
          {chunkedPages.map((pageItems, pageIndex) => (
            <div 
              key={`page-${pageIndex}`} 
              id={`preview-page-${pageIndex}`} 
              className="bg-white shadow-2xl w-[215.9mm] min-h-[279.4mm] h-auto p-10 relative flex flex-col shrink-0 print:shadow-none print:w-full print:min-h-0 print:h-auto print:p-2 print:m-0"
            >
              {/* HEADER - Only on first page */}
              {pageIndex === 0 && (
                <>
                  <div className="flex justify-between mb-8 items-start">
                    {/* Brand / Logo Layout */}
                    <div className="flex flex-col">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/50/Logo_Bureau_en_gros_2018.svg"
                        alt="Bureau en Gros"
                        className="h-9 w-auto object-contain object-left"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-sm text-gray-400 font-bold uppercase mt-2 tracking-widest ml-1">
                        Centre de Solutions
                      </div>
                    </div>

                    {/* Right Meta Data */}
                    <div className="text-right">
                      <div className="text-[#e21836] font-bold text-4xl tracking-widest">DEVIS</div>
                      <div className="text-sm font-bold mt-1 uppercase">
                        {devis ? `#${devis}` : ''}
                      </div>
                      <div className="text-sm mt-1 text-gray-600 font-medium">
                         {date}
                      </div>
                    </div>
                  </div>

                  {/* INFO BLOCKS */}
                  <div className="grid grid-cols-2 gap-8 text-sm mb-8">
                    {/* Succursale Info */}
                    <div>
                      <div className="font-bold text-gray-400 uppercase mb-1">De :</div>
                      <div className="font-bold">Bureau en Gros {succursale ? `- Succursale #${succursale}` : ''}</div>
                      <div>{sContact}</div>
                      <div className="whitespace-pre-wrap">{sAdresse}</div>
                      <div className="mt-1">{sTel && `T. ${sTel}`}{sFax && sTel && ' | '}{sFax && `F. ${sFax}`}</div>
                      <div>{sEmail}</div>
                    </div>

                    {/* Client Info */}
                    <div className="border-l-2 border-red-600 pl-4">
                      <div className="font-bold text-gray-400 uppercase mb-1">Pour :</div>
                      <div className="font-bold">{cEntreprise}</div>
                      <div>{cContact}</div>
                      <div className="whitespace-pre-wrap">{cAdresse}</div>
                      <div className="mt-1">{cTel && `T. ${cTel}`}{cFax && cTel && ' | '}{cFax && `F. ${cFax}`}</div>
                      <div>{cEmail}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Page Number (if multi-page) */}
              {chunkedPages.length > 1 && (
                <div className="absolute top-4 right-10 text-xs font-bold text-gray-400">
                  Page {pageIndex + 1} / {chunkedPages.length}
                </div>
              )}

              {/* DATA TABLE */}
              <div className="border border-black flex-none flex flex-col mb-6">
                {/* Table Header */}
                <div className="grid grid-cols-[80px_1fr_100px_100px] text-xs font-bold bg-gray-50 border-b border-black uppercase">
                  <div className="p-2 border-r border-black text-center">QTÉ</div>
                  <div className="p-2 border-r border-black text-center">DESCRIPTION</div>
                  <div className="p-2 border-r border-black text-right">UNITÉ</div>
                  <div className="p-2 text-right">TOTAL</div>
                </div>
                
                {/* Table Body */}
                <div className="flex-1 flex flex-col">
                  {pageItems.map((item) => {
                    const qty = parseFloat(item.qty) || 0;
                    const price = parseFloat(item.price) || 0;
                    const itemTotal = qty * price;
                    return (
                      <div key={item.id} className="grid grid-cols-[80px_1fr_100px_100px] text-sm border-b border-gray-100 min-h-[40px] break-inside-avoid">
                        <div className="p-3 border-r border-black flex flex-col justify-center text-center">{item.qty}</div>
                        <div className="p-3 border-r border-black whitespace-pre-wrap break-words flex flex-col justify-center text-center">{item.desc}</div>
                        <div className="p-3 border-r border-black flex flex-col justify-center text-right">{item.price ? `${price.toFixed(2)} $` : ''}</div>
                        <div className="p-3 flex flex-col justify-center text-right">
                          {item.qty && item.price ? `${itemTotal.toFixed(2)} $` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER - Only on last page */}
              {pageIndex === chunkedPages.length - 1 ? (
                <>
                  {/* INSTRUCTIONS SPÉCIALES */}
                  {instructions && (
                    <div className="mb-6 flex flex-col">
                      <div className="font-bold text-gray-400 text-xs uppercase mb-1">INSTRUCTIONS SPÉCIALES</div>
                      <div className="text-sm whitespace-pre-wrap text-gray-800 p-4 bg-gray-50 border border-gray-200 rounded">{instructions}</div>
                    </div>
                  )}
                  
                  <div className="flex-1"></div>

                  {/* FOOTER & TOTALS */}
                  <div className="mt-auto pt-6 flex justify-between border-t border-black break-inside-avoid">
                    <div className="text-[11px] text-gray-500 w-1/2 flex flex-col gap-2 leading-relaxed">
                      <p>Ceci est une demande de devis, non une commande finale.</p>
                      <p>Valide durant 14 jours, à partir de la date originale mentionnée ci-haut.</p>
                      <p>Les prix sont sujets à changement sans préavis.</p>
                      <p className="font-bold text-gray-800 mt-2 text-xs">MERCI DE VOTRE CONFIANCE !</p>
                    </div>
                    
                    <div className="w-[220px] flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">SOUS-TOTAL</span>
                        <span>{totalPartiel > 0 ? `${totalPartiel.toFixed(2)} $` : '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TRANSPORT</span>
                        <span>{tTransport > 0 ? `${tTransport.toFixed(2)} $` : '-'}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span>TAXES</span>
                        <span className="text-gray-900">{tTaxes > 0 ? `${tTaxes.toFixed(2)} $` : '-'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-black">
                        <span>TOTAL</span>
                        <span>{total > 0 ? `${total.toFixed(2)} $` : '-'}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1"></div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
