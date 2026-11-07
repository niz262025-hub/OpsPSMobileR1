import React, { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDataSource, type PaymentRecordRow } from '../services/repository';
import { getSupabaseClient } from '../services/supabaseClient';
import { paymentProofPreview, uploadPaymentProof } from '../services/paymentProof';
import { THEME } from '../theme';

export default function OrderPaymentPanel({businessId,orderId,total,onChanged}:{businessId:string;orderId:string;total:number;onChanged:()=>void}){
 const {user,role}=useAuth();
 const [payment,setPayment]=useState<PaymentRecordRow|null>(null),[reference,setReference]=useState(''),[receipt,setReceipt]=useState('');
 const [loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[preview,setPreview]=useState('');
 const canReview=role==='founder'||role==='admin';
 useEffect(()=>{let active=true;setLoaded(false);void getDataSource('production').payments.getByOrder(businessId,orderId).then(next=>{if(active){setPayment(next);setLoaded(true);}}).catch(()=>{if(active)setMessage('Payment details could not be loaded.');});return()=>{active=false;};},[businessId,orderId]);
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setMessage('');try{await action();}catch(error){setMessage(error instanceof Error?error.message:'Payment operation failed.');}finally{setBusy(false);}};
 const submit=()=>run(async()=>{
  if(!receipt&&!reference.trim())throw new Error('Upload proof or enter a payment reference.');
  const next=await getDataSource('production').payments.submitDirectQrPayment({businessId,orderId,amount:total,receiptUri:receipt||undefined,customerPaymentReference:reference.trim()||undefined});
  if(!next)throw new Error('Payment evidence could not be saved. Please retry.');
  setPayment(next);setMessage('Evidence submitted. Payment is awaiting verification.');onChanged();
 });
 const verify=()=>run(async()=>{
  if(!payment||!canReview||!user?.id)return;
  const next=await getDataSource('production').payments.verifyDirectQrPayment(payment.id,businessId,user.id);
  if(!next)throw new Error('Payment could not be verified. Check the evidence and amount.');
  setPayment(next);setMessage('Payment verified.');onChanged();
 });
 const showProof=()=>run(async()=>{
  const client=getSupabaseClient();if(!client||!payment?.receipt_uri)throw new Error('No proof is attached.');
  if(payment.receipt_uri.endsWith('.pdf'))throw new Error('PDF preview is not available in this view.');
  setPreview(await paymentProofPreview(client,businessId,payment.receipt_uri));
 });
 const status=payment?.payment_status??'not_submitted';
 return <View style={styles.card}>
  <Text style={styles.title}>Payment evidence</Text>
  <Text>Amount: RM{total.toFixed(2)}</Text><Text>Payment status: {status.replaceAll('_',' ')}</Text>
  {!loaded?<Text>Loading payment details…</Text>:null}
  {loaded&&!payment?<>
   <Text style={styles.label}>Payment reference</Text>
   <TextInput accessibilityLabel="Payment reference" placeholder="Bank or QR transaction reference" value={reference} onChangeText={setReference} editable={!busy} style={styles.input}/>
   {Platform.OS==='web'?<input type="file" aria-label="Upload payment proof" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void run(async()=>{const client=getSupabaseClient();if(!client||!user?.id)throw new Error('MYOPS session required.');setReceipt(await uploadPaymentProof(client,businessId,orderId,user.id,file));setMessage('Proof uploaded privately. Submit it for verification.');});}}/>:null}
   {receipt?<Text>Attachment uploaded.</Text>:null}
   <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={()=>void submit()}><Text style={styles.buttonText}>{busy?'Saving…':'Submit payment evidence'}</Text></Pressable>
  </>:null}
  {payment?.receipt_uri?<Pressable accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={()=>void showProof()}><Text>View payment proof</Text></Pressable>:null}
  {preview?<Image accessibilityLabel="Payment proof preview" source={{uri:preview}} style={styles.proof} resizeMode="contain"/>:null}
  {canReview&&payment&&['submitted','pending_verification'].includes(status)?<>
   <Text>Confirm only after checking the proof and received amount.</Text>
   <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={()=>void verify()}><Text style={styles.buttonText}>{busy?'Verifying…':'Verify received payment'}</Text></Pressable>
  </>:null}
  {message?<Text accessibilityRole="alert">{message}</Text>:null}
 </View>;
}
const styles=StyleSheet.create({card:{backgroundColor:THEME.surface,borderWidth:1,borderColor:THEME.border,borderRadius:14,padding:20,gap:12,marginBottom:16},title:{fontSize:18,fontWeight:'700',color:THEME.text.primary},label:{fontWeight:'700'},input:{borderWidth:1,borderColor:THEME.border,borderRadius:8,padding:12},button:{backgroundColor:THEME.primary,borderRadius:8,padding:13,alignItems:'center'},buttonText:{color:'#FFFFFF',fontWeight:'700'},secondary:{borderWidth:1,borderColor:THEME.border,borderRadius:8,padding:12},proof:{width:'100%',height:320}});
