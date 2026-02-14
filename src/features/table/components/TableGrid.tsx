"use client";

import { useRef } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import type { HotTableRef } from '@handsontable/react-wrapper';

// CSS: Handsontable base + dark theme overrides
import 'handsontable/dist/handsontable.full.min.css';
import './TableGrid.css';

registerAllModules();

const hfInstance = HyperFormula.buildEmpty({
  licenseKey: 'internal-use-in-handsontable',
});

export default function TableGrid({ data, setData }: { data: any[]; setData: (d: any[]) => void }) {
  const hotRef = useRef<HotTableRef>(null);

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
        formulas={{ engine: hfInstance }}
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
