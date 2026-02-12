"use client";

import { useEffect, useState } from 'react';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';

// Import du CSS
import 'handsontable/dist/handsontable.full.min.css';

registerAllModules();

export default function TableGrid({ data, setData }: { data: any[], setData: (d: any[]) => void }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="p-4 text-neutral-500">Chargement de la grille...</div>;

  const hfInstance = HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style jsx global>{`
        .handsontable { color: #fff !important; }
        .handsontable .htCore { background-color: #000 !important; }
        .handsontable th, .handsontable td { 
          background-color: #000 !important; 
          color: #fff !important; 
          border: 1px solid #333 !important;
        }
        .handsontable th { background-color: #111 !important; }
        .ht_master .wtHolder { overflow: auto !important; }
      `}</style>

      <HotTable
        data={data}
        colHeaders={true}
        rowHeaders={true}
        height="100%"
        width="100%"
        licenseKey="non-commercial-and-evaluation"
        formulas={{ engine: hfInstance }}
        manualColumnResize={true}
        contextMenu={true}
        stretchH="all" // Force les colonnes à prendre toute la largeur
        afterChange={(changes) => {
          if (changes) setData([...data]);
        }}
      />
    </div>
  );
}