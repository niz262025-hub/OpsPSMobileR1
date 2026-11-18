import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { apps, type AppDefinition } from './apps';

type Props = {
  displayName?: string;
  canAccess: (app: AppDefinition) => boolean;
  onOpen: (app: AppDefinition) => void;
  onSignIn: () => void;
  authenticated: boolean;
};
export function MobileDashboard({ displayName, canAccess, onOpen, onSignIn, authenticated }: Props) {
  return <View style={styles.page}>
    <Text style={styles.heading}>MYOPS</Text>
    <Text style={styles.subheading}>{authenticated ? `Welcome, ${displayName || 'User'}` : 'One account. Your operations.'}</Text>
    {!authenticated && <Pressable accessibilityRole="button" style={styles.signIn} onPress={onSignIn}><Text style={styles.signInText}>Sign in with MYOPS</Text></Pressable>}
    <FlatList data={apps} keyExtractor={item => item.id} numColumns={2}
      contentContainerStyle={styles.grid} renderItem={({item}) => {
        const enabled = authenticated && item.status === 'available' && canAccess(item);
        return <Pressable accessibilityRole="button" accessibilityState={{disabled:!enabled}}
          onPress={() => enabled && onOpen(item)} disabled={!enabled} style={styles.card}>
          <Text style={styles.appTitle}>{item.title}</Text>
          <Text style={styles.status}>{item.status === 'coming-soon' ? 'Coming soon' : !authenticated ? 'Sign in required' : enabled ? 'Open' : 'Access required'}</Text>
        </Pressable>;
      }} />
  </View>;
}
const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:'#F5F7FC',paddingTop:48,paddingHorizontal:16},
  heading:{fontSize:28,fontWeight:'800',color:'#273C91'},
  subheading:{fontSize:15,color:'#52607A',marginTop:6},
  signIn:{backgroundColor:'#5149B8',padding:15,borderRadius:12,marginTop:20},
  signInText:{color:'#FFF',textAlign:'center',fontWeight:'700'},
  grid:{paddingTop:20,paddingBottom:30},
  card:{flex:1,margin:6,padding:18,minHeight:120,borderRadius:16,backgroundColor:'#FFF',justifyContent:'space-between'},
  appTitle:{fontSize:17,fontWeight:'700',color:'#253052'},
  status:{fontSize:12,color:'#59647C',marginTop:14}
});
