"use client";

import { useEffect, useState, useRef } from 'react';
import { HotTable, HotTableClass } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';

// CSS: Handsontable base + dark theme overrides
import 'handsontable/dist/handsontable.full.min.css';
import './TableGrid.css';

registerAllModules();

export default function TableGrid({ data, setData }: { data: any[]; setData: (d: any[]) => void }) {
  const [isMounted, setIsMounted] = useState(false);
  const hotRef = useRef<HotTableClass>(null);
  const hfRef = useRef<HyperFormula | null>(null);

  // Create HyperFormula instance once
  if (!hfRef.current) {
    hfRef.current = HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
    });
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-4 text-neutral-500">Chargement de la grille...</div>;
  }

  return (
    <div className="absolute inset-0 overflow-auto">
      <HotTable
        ref={hotRef}
        data={data}
        colHeaders={true}
        rowHeaders={true}
        height="100%"
        width="100%"
        licenseKey="non-commercial-and-evaluation"
        formulas={{ engine: hfRef.current }}
        manualColumnResize={true}
        contextMenu={true}
        stretchH="all"
        afterChange={(changes) => {
          if (changes) setData([...data]);
        }}
      />
    </div>
  );
}
