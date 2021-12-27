import './App.css';
import React,{useState} from'react';
import Chart from './components/Chart';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {

  //El componente principal maneja dos estados, para guardar las ultimas temperatura y potencia y pasarlas al
  //componente Widget. Para esto uso dos métodos para poder leer dentro de Chart que es donde se reciben y se procesan
  //los datos en bruto.    

  const [lastTemp, setLastTemp] = useState(false);
  const [lastPower, setLastPower] = useState(false);

  const getLastTemp =(lastTemperature)=>{
    setLastTemp(lastTemperature)
  }

  const getLastPower = (lastPower) => {
    setLastPower(lastPower);
  }

  return (
    <div className="App">
      <Header lastTemp={lastTemp} lastPower={lastPower}/> 
      <Chart getLastTemp={getLastTemp} getLastPower={getLastPower} />
      <Footer/>
    </div>
  );
}

export default App;
