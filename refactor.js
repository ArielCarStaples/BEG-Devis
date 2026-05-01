const fs = require('fs');
let s = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Root and Header
s = s.replace(
  /\<div className="bg-gray-200 h-screen overflow-hidden flex font-sans text-gray-900"\>[\s\S]*?\<h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2"\>Générateur de Devis\<\/h2\>/,
  `<div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* App Header */}
      <header className="h-16 bg-white border-b border-gray-300 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-black px-2 py-1 text-xl italic tracking-tighter rounded-sm">B</div>
          <h1 className="text-lg font-bold tracking-tight">Centre de Solutions <span className="text-gray-400 font-normal">/ Devis</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 font-medium italic">Dernière sauvegarde : {new Date().toLocaleTimeString('fr-CA', {hour: '2-digit', minute:'2-digit'})}</div>
          <button
            onClick={() => window.print()}
            className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-700 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            EXPORTER PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT SIDEBAR: INPUT FORM */}
        <div id="sidebar" className="w-[320px] bg-white border-r border-gray-300 p-5 overflow-y-auto flex flex-col gap-6 z-10 shrink-0">
          <div className="flex-1 space-y-5" id="input-form">`
);

// 2. Remove print button and wrapper at the bottom of sidebar
s = s.replace(
  /\{\/\* Print Button sticky bottom \*\/\}[\s\S]*?\<\/div\>\n\s*\<\/div\>/,
  `
          </div>
        </div>`
);

// 3. Classes updates (global replace)
const classesMap = [
  ['block text-xs font-bold mb-1 text-gray-600 uppercase', 'text-[10px] font-bold text-gray-500 tracking-widest uppercase'],
  ['block text-xs font-bold mb-1 text-gray-600', 'text-[10px] font-bold text-gray-500 tracking-widest uppercase'],
  ['w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500 focus:outline-none text-sm text-right', 'w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 mt-1 focus:ring-2 focus:ring-red-500 focus:outline-none text-right'],
  ['w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-red-500 focus:outline-none text-sm', 'w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 mt-1 focus:ring-2 focus:ring-red-500 focus:outline-none'],
  ['border border-gray-300 p-2 rounded focus:ring-1 focus:ring-red-500 text-sm text-center', 'w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-1 focus:ring-red-500 text-center'],
  ['border border-gray-300 p-2 rounded focus:ring-1 focus:ring-red-500 text-sm text-right', 'w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-1 focus:ring-red-500 text-right'],
  ['border border-gray-300 p-2 rounded focus:ring-1 focus:ring-red-500 text-sm', 'w-full text-xs border border-gray-300 p-1.5 rounded bg-gray-50 focus:ring-1 focus:ring-red-500'],
  ['bg-gray-100 p-2 font-bold mb-3 text-sm text-gray-700 rounded uppercase tracking-wide border-l-4 border-gray-400', 'text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2'],
  ['bg-red-50 p-2 font-bold mb-3 text-sm text-red-800 rounded uppercase tracking-wide border-l-4 border-red-600', 'text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2'],
  ['bg-blue-50 p-2 font-bold mb-3 text-sm text-blue-800 rounded uppercase tracking-wide border-l-4 border-blue-500 flex justify-between items-center', 'text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-1 mb-2 flex justify-between items-center'],
  ['w-2/3 h-full overflow-y-auto bg-gray-500 flex justify-center py-8', 'flex-1 h-full overflow-y-auto bg-gray-500 flex justify-center items-start p-8'],
  ['bg-white shadow-2xl w-[210mm] min-h-[297mm] p-12 relative flex flex-col mx-auto', 'bg-white shadow-2xl w-[210mm] min-h-[297mm] p-10 relative flex flex-col mx-auto shrink-0'],
  ['text-[13px]', 'text-[10px]'],
  ['border-[2px]', 'border'],
  ['text-[#e21836] font-bold text-xl leading-none tracking-tight', 'text-[#e21836] font-bold text-lg leading-none italic'],
  ['text-[#e21836] font-bold text-4xl leading-none tracking-tighter', 'text-[#e21836] font-bold text-2xl leading-none not-italic tracking-tighter'],
  ['text-[#e21836] font-bold text-3xl leading-none ml-1', 'hidden'],
  ['text-[28px]', 'text-lg'], // "centre de solutions"
  ['text-5xl', 'text-3xl'], // "DEVIS"
  ['h-8 border-b', 'h-6 border-b'] // Totals row height adjustment
];

classesMap.forEach(([from, to]) => {
  s = s.split(from).join(to);
});

// 4. Add the closing div for the app layout
if (!s.includes('{/* App Header */}')) {
  console.error("Replacement 1 failed!");
} else {
  s = s.replace(
    /\<\/div\>\n    \<\/div\>\n  \);\n\}/,
    '      </div>\n      </div>\n    </div>\n  );\n}'
  );
}

s = s.split('text-[9px] font-bold text-right w-48 mt-1').join('text-[7px] font-bold text-right w-32 mt-1');
s = s.split('text-[8px] text-gray-600 font-bold').join('text-[6px] text-gray-600 font-bold');

fs.writeFileSync('src/App.tsx', s);
console.log('App.tsx string replacements completed.');
