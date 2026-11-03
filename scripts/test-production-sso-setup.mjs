import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { configureProductionSso, projectRef } from './configure-production-sso.mjs';
import { log } from 'node:console';
const directory=mkdtempSync(join(tmpdir(),'opsps-setup-test-'));
let envFile, calls=0;
try {
  const result=configureProductionSso({directory,run:args=>{
    assert.equal(args[args.indexOf('--project-ref')+1],projectRef);
    calls++;
    if(args[1]==='set') {
      envFile=args[args.indexOf('--env-file')+1];
      assert.equal(statSync(envFile).mode & 0o777,0o600);
      const values=Object.fromEntries(readFileSync(envFile,'utf8').trim().split('\n').map(line=>{const i=line.indexOf('=');return[line.slice(0,i),JSON.parse(line.slice(i+1))];}));
      assert.equal(values.MYOPS_APP_API_ORIGIN,'https://www.myops.com.my');
      assert.equal(values.OPSPS_ALLOWED_ORIGINS,'https://opsp-mobile-r1.vercel.app');
      assert.equal(values.MYOPS_STAGING_SHARE_TOKEN,undefined);
      const privateKey=createPrivateKey(values.MYOPS_APP_PRIVATE_KEY_CURRENT);
      const publicKey=createPublicKey(readFileSync(join(directory,'opsps-production-public-key.pem'),'utf8'));
      assert.equal(privateKey.asymmetricKeyType,'ed25519');
      assert.ok(verify(null,Buffer.from('check'),publicKey,sign(null,Buffer.from('check'),privateKey)));
      return {status:0,stdout:'not printed'};
    }
    return {status:0,stdout:JSON.stringify(calls===1?[]:['MYOPS_APP_ID','MYOPS_APP_API_ORIGIN','MYOPS_KEY_VERSION','OPSPS_ALLOWED_ORIGINS','MYOPS_APP_PRIVATE_KEY_CURRENT'].map(name=>({name})))};
  }});
  assert.equal(result.secretCount,5);assert.equal(existsSync(envFile),false);
  assert.ok(existsSync(result.publicPath));
  assert.throws(()=>configureProductionSso({directory,run:()=>assert.fail('must not rotate')}),/receipt already exists/);
  const second=mkdtempSync(join(tmpdir(),'opsps-existing-test-'));
  try {
    for(const name of ['MYOPS_APP_PRIVATE_KEY_CURRENT','MYOPS_STAGING_SHARE_TOKEN']) {
      assert.throws(()=>configureProductionSso({directory:second,run:()=>({status:0,stdout:JSON.stringify([{name}])})}),/refusing/);
      assert.equal(existsSync(join(second,'opsps-production-public-key.pem')),false);
    }
    assert.throws(()=>configureProductionSso({directory:second,run:()=>({status:1,stderr:'sensitive upstream output'})}),/CLI access unavailable/);
  } finally { rmSync(second,{recursive:true,force:true}); }
  const failed=mkdtempSync(join(tmpdir(),'opsps-upload-failure-'));
  let pendingFile;
  try {
    assert.throws(()=>configureProductionSso({directory:failed,run:args=>{
      if(args[1]==='list') return {status:0,stdout:'[]'};
      pendingFile=args[args.indexOf('--env-file')+1];
      return {status:1,stderr:'upstream must never be printed'};
    }}),/upload was not confirmed/);
    assert.equal(existsSync(pendingFile),false);
    assert.ok(existsSync(join(failed,'opsps-production-public-key.pem')));
  } finally {rmSync(failed,{recursive:true,force:true});}
  log('PASS: exact production scope, Ed25519 key pair, private temp permissions/cleanup, public-only receipt, no rotation or upstream secret output');
} finally { rmSync(directory,{recursive:true,force:true}); }
