import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {useLanguage} from '../context/LanguageContext';
import {THEME} from '../theme';
export function LanguageSelector(){
 const {language,setLanguage,languages,t}=useLanguage();
 return <View accessibilityLabel={t.settings.language} style={{flexDirection:'row',flexWrap:'wrap',gap:6,paddingVertical:6}}>
  {languages.map(option=><Pressable key={option.code} accessibilityRole="button" accessibilityState={{selected:language===option.code}} onPress={()=>{void setLanguage(option.code);}}
   style={{padding:8,borderRadius:8,backgroundColor:language===option.code?THEME.primary:'#FFFFFF',borderWidth:1,borderColor:THEME.primary}}>
   <Text style={{color:language===option.code?'#FFFFFF':THEME.primary}}>{option.label}</Text>
  </Pressable>)}
 </View>;
}
