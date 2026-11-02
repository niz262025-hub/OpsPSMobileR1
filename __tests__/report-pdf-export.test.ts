import {writeFile} from 'node:fs/promises';
import process from 'node:process';
import {Blob as NodeBlob, Buffer} from 'node:buffer';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {PDFDocument,PDFArray,decodePDFRawStream,type PDFRawStream} from 'pdf-lib';
import {exportPdf} from '../services/reporting';
vi.mock('../services/myopsFeatures',()=>({requireMyopsFeature:vi.fn().mockResolvedValue(undefined)}));
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('PDF financial report completeness',()=>{
 it('preserves the final financial fields of a long detail row',async()=>{
  let saved:NodeBlob|undefined;
  vi.stubGlobal('Blob',NodeBlob);
  vi.stubGlobal('URL',{createObjectURL:(blob:NodeBlob)=>{saved=blob;return 'blob:uat';},revokeObjectURL:()=>{}});
  vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  await exportPdf('trip_profit',{summary:{Rows:1},rows:Array.from({length:20},(_,index)=>({Trip:'Dummy trip with a long name '.repeat(5),Destination:`Dummy destination ${index}`,Sales:1234.56,'Other Expenses':246.91,'Net Profit':987.65}))},'2026-11-01','2026-11-30');
  expect(saved).toBeDefined();
  if(process.env.OPSPS_UAT_PDF_PATH) await writeFile(process.env.OPSPS_UAT_PDF_PATH,new Uint8Array(await saved!.arrayBuffer()));
  const pdf=await PDFDocument.load(new Uint8Array(await saved!.arrayBuffer()));let text='';
  for(const page of pdf.getPages()){
   const contents=page.node.Contents();const refs=contents instanceof PDFArray?contents.asArray():[contents];
   for(const ref of refs){const stream=pdf.context.lookup(ref!) as PDFRawStream;const raw=new TextDecoder().decode(decodePDFRawStream(stream).decode());
    for(const match of raw.matchAll(/<([A-Fa-f0-9]+)>\s*Tj/g)) text+=Buffer.from(match[1],'hex').toString('latin1')+'\n';
   }
  }
  expect(text).toContain('Net Profit: 987.65');
  expect(text).toContain('Dummy destination 19');
  expect(pdf.getPageCount()).toBeGreaterThan(1);
 });
});
