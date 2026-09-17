import React from "react";

interface DocsTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}

export function DocsTable({ headers, rows }: DocsTableProps) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-border bg-surface-elevated/20">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-elevated/70 text-foreground">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 font-semibold font-mono text-[11px] uppercase tracking-wider text-muted"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 font-sans">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-surface-elevated/40 transition-colors"
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className="px-4 py-3 text-muted leading-normal align-top [&>code]:font-mono [&>code]:text-accent [&>code]:bg-surface-elevated [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:border [&>code]:border-border"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
