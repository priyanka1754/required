import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
  title: string; // dynamic title for each screen
};

const BackHeader: React.FC<Props> = ({ title }) => {
  const navigation = useNavigation<any>();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ParentingFeed'); // or your home screen
    }
  };

  return (
    <View style={styles.container} className='shadow-sm'>
      {/* left circle back button */}
      <TouchableOpacity onPress={handleBack} style={styles.circleBtn}>
        <Icon name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      {/* center / left title */}
      <Text style={styles.title}>{title}</Text>

      {/* right side empty to keep spacing similar to your design */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6e6e6',
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  rightPlaceholder: {
    width: 32,
    height: 32,
  },
});

export default BackHeader;
