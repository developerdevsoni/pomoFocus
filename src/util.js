import AsyncStorage from '@react-native-async-storage/async-storage';

const setStarage = async (key, value) => {
  const stringObj = JSON.stringify(value);
  await AsyncStorage.setItem(key, stringObj);
};

const getStorage = async key => {
  const value = (await AsyncStorage.getItem(key)) || '';
  return value ? JSON.parse(value) : '';
};



export {setStarage, getStorage}; 