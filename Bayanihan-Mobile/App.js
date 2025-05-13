// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import AuthStack from './src/navigation/AuthStack';
// import AppStack from './src/navigation/AppStack';

// function App () {
//   return (
//     <NavigationContainer>
//       {/* <AppStack /> */}
//       <AuthStack/>
//     </NavigationContainer>
//   )
// }

// export default App;

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './src/navigation/AuthStack';
import AppStack from './src/navigation/AppStack';

function App () {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStack /> : <AuthStack onLogin={() => setIsLoggedIn(true)} />}
    </NavigationContainer>
  );
}

export default App;