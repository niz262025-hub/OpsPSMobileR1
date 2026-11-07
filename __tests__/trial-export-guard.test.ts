import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../services/myopsFeatures',()=>({requireMyopsFeature:vi.fn().mockRejectedValue(new Error('Upgrade in MYOPS'))}));
import {exportPdf,exportExcel} from '../services/reporting';
afterEach(()=>vi.unstubAllGlobals());
it('rejects both report exporters before any download when server feature authorization denies trial access',async()=>{
 const createObjectURL=vi.fn();vi.stubGlobal('URL',{createObjectURL});
 for(const exporter of [exportPdf,exportExcel])await expect(exporter('sales',{rows:[],summary:{Rows:0}},'2026-11-01','2026-11-30')).rejects.toThrow('Upgrade in MYOPS');
 expect(createObjectURL).not.toHaveBeenCalled();
});
