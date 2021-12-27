import { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

// <> para recibir del servidor en vivo de heroku, descomentar linea siguiente:
const ENDPOINT = "https://meteologica-app-server.herokuapp.com"

// <> para probar localmente, descomentar linea siguiente:
//tambien es necesario copiar la misma dirección en el package.json, como un key despues de scripts:
//"proxy": "http://127.0.0.1:4001"
// const ENDPOINT = "http://127.0.0.1:4001";

const globalColor = '#111d2b'

//Este componente recibe como props, métodos para enviar al padre App, las ultimas temperatura y potencia del array

export default function Chart({getLastTemp,getLastPower}) {
    
    const [temperatures, setTemperatures] = useState([]);
    const [power, setPower] = useState([]);
    const [onLight, setOnLight] = useState(false);  
    

    //método que recibe un array de temperaturas en Kelvin y devuelve un array de temperaturas en °C
    const tempsInCelsius =(kelvinTemperatures) =>{
        const convertedTemperatures = kelvinTemperatures.map(each=>{
            const celsius = each - 273.15
            return (celsius)
        })
        return convertedTemperatures
    }

    //método que recibe un array de potencias en MW y devuelve un array de potencias en KW
    const toKW = (MWpowers) =>{
        const KWpowers= MWpowers.map(each=>{
            return each*1000
        })
        return KWpowers
    }

  
    //método que recibe el un array de datos de tiempo y valores y devuelve dos array separados, uno para tiempo y  otro para los valores correspondientes
    const makeAxis = (rawData) =>{
        const xAxis = rawData.map((each)=>(
            each.time
        ))
        const yAxis = rawData.map((each)=>(
            each.value
        ))
        const plotData = [xAxis,yAxis]
        return plotData;
    }
    
    //Se prepara el array de tiempos, para eje X de grafica, makeAxis devuelve un array de dos array, tiempo y valores.
    let tempTimeArray = makeAxis(temperatures)[0]

    //Se prepara los dos arrays para temp y pot. respectivamente,  para pasar al componente de  plotly.js y graficar
    let plotReadyTemps = tempsInCelsius(makeAxis(temperatures)[1])
    let plotReadyPowers = toKW(makeAxis(power)[1])

    //valores para el widget, en el primer renderizado muestra 0.
    let lastTemperature = typeof plotReadyTemps[plotReadyTemps.length-1] === "undefined"? 0 : plotReadyTemps[plotReadyTemps.length-1]  ; 
    let lastPower = typeof plotReadyPowers[plotReadyPowers.length-1] === "undefined"? 0 : plotReadyPowers[plotReadyPowers.length-1]; 
    
    //UseEffect: En el primer renderizado se conecta con el ENDPOINT especificado a traves de la libreria de socket.io-client. Luego el socket escucha por 
    //el evento "sendingData" y la respuesta es un objeto donde vienen un array para temperatura y otro para potencia, actualizados desde el servidor. 
    //finalmente en el evento "disconnect" cambia el estado de onLight, que hace de luz testigo y aplica estilos en el UI
    // (verde, recibiendo datos. O desconectado, rojo)
    useEffect(() => {
        const socket = socketIOClient(ENDPOINT)

        socket.on("sendingData", resp => {
            setTemperatures(resp.updatedTemperatures);
            setPower(resp.updatedPowers);
            setOnLight(true);
        });


        socket.on("disconnect", () => {
            setOnLight(false);
          });
    }, []);

    //useEffect para llamar los métodos provistos por el padre App para leer la temp y pot. mas recientes. Tambien se redeondea a dos decimales
    //para mejor vizualizacion en el widget. 
    useEffect(()=>{
        getLastTemp(lastTemperature.toFixed(2))
        getLastPower(lastPower.toFixed(2))
    },[lastTemperature,lastPower,getLastTemp,getLastPower])

    //A continuación se definen los objetos que configurarán los ejes x y Y de cada gráfica. (detalles en docs de plotly.js)
    const tempXaxisOptions = {
        range:[(tempTimeArray.length)-120,tempTimeArray.length],
        title:'Time',
        titlefont:{color:'white'},
        tickfont:{color:'white'},
        tickmode:'linear',
        dtick:12,
    }

    const tempYaxisOptions = {
        //Esta es la forma que encontré para mantener la linea visible. Pues mientras el eje x se va "deslizando" se pierde el rango, entonces
        //definiendo el rango como el ultimo dato mas/menos un estimado de lo que varía, siempre quedará visible lo mas nuevo de la grafica.
        range:[lastTemperature-0.2,lastTemperature+0.9],
        title:'Temp (C°)',
        titlefont:{color:'white'},      
        tickfont:{color:'white'}
    }

    const powerXaxisOptions = {
        //para los ejex X, el numero 120 sale de mostrar 10 minutos de rango visible. Pues cada minuto son 12 intervalor (dtick) de 5 segundos.
        range:[(tempTimeArray.length)-120,tempTimeArray.length],
        title:'Time',
        titlefont:{color:'white'},
        tickfont:{color:'white'},
        tickmode:'linear',
        dtick:12,
    }

    const powerYaxisOptions = {
        //Estos números son arbitrarios y dependen del tipo de datos. Para los proveidos res un rango que permanece visible las ultimas potencias.
        range:[lastPower-500,lastPower+1000],
        title:'Power (KW)',
        titlefont:{color:'white'},
        tickfont:{color:'white'}
    }

  return (

    <>
        <div className={onLight?"loader active":"loader"}>
            {onLight?<p>Connected! receiving data</p>:<p>Disconnected...</p>}
        </div>

        <div className="charts">

            <Plot
                data={[
                    {
                        type:'scatter',
                        mode:'lines',
                        x:tempTimeArray,
                        y:plotReadyTemps
                    }
                ]}  

                layout={{
                    title:'Temperature',
                    font:{
                        color:'rgb(179, 179, 179)'
                    },
                    xaxis:tempXaxisOptions,
                    yaxis:tempYaxisOptions,
                    paper_bgcolor:globalColor,
                    plot_bgcolor:globalColor,
                }}
            />
            <Plot
                data={[
                    {
                        type:'scatter',
                        mode:'lines',
                        x:tempTimeArray,
                        y:plotReadyPowers
                    }
                ]}
                layout={{
                    title:'Power',
                    font:{
                        color:'rgb(179, 179, 179)'
                    },
                    xaxis:powerXaxisOptions,
                    yaxis:powerYaxisOptions,
                    paper_bgcolor:globalColor,
                    plot_bgcolor:globalColor,

                }}
            />
        </div>
    </>
  );
}

