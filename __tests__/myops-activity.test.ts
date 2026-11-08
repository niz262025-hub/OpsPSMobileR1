import {expect,it} from 'vitest';
import {createMyopsActivityTracker} from '../services/myopsActivity';
it('passive polling and synthetic or hidden interactions cannot renew the session',()=>{
 const t=createMyopsActivityTracker();
 t.record({isTrusted:false},true);t.record({isTrusted:true},false);
 expect(t.snapshot().active).toBe(false);
});
it('sends each visible trusted interaction once and keeps newer activity while a refresh is in flight',()=>{
 const t=createMyopsActivityTracker();t.record({isTrusted:true},true);
 const first=t.snapshot();expect(first.active).toBe(true);
 t.record({isTrusted:true},true);t.acknowledge(first.version);
 const second=t.snapshot();expect(second.active).toBe(true);
 t.acknowledge(second.version);expect(t.snapshot().active).toBe(false);
});
