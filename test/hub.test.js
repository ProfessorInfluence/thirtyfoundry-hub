'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {handler, catalog} = require('../server');

test('catalog always exposes thirty valid slots', async () => {
  const products = await catalog();
  assert.equal(products.length, 30);
  assert.ok(products.every(product => ['planned','building','live','blocked'].includes(product.status)));
});

async function invoke(path) {
  const req=new EventEmitter();Object.assign(req,{url:path,method:'GET',headers:{host:'localhost'},socket:{remoteAddress:'test'}});
  return new Promise((resolve,reject)=>{const chunks=[];const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(chunk){if(chunk)chunks.push(Buffer.from(chunk));resolve({status:this.status,body:Buffer.concat(chunks).toString()});}};handler(req,res).catch(reject);});
}
test('health and home render', async () => {
  assert.deepEqual(JSON.parse((await invoke('/health')).body), {ok:true});
  const home = (await invoke('/')).body;
  assert.match(home, /Thirty narrow tools/);
  assert.match(home, /ScopeSignal/);
});
