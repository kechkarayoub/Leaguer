module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/', './assets/images/'],
  dependencies: {
    'react-native-config': {
      platforms: {
        android: null, // disable Android platform auto linking
        ios: null, // disable iOS platform auto linking
      },
    },
  },
};
