import React from 'react';
import ReactSpeedometer from 'react-d3-speedometer';
import {useState,useEffect} from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;

const Speedometer = () => {
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadBuildings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/arrq`);

        if (isMounted && Array.isArray(response.data)) {
          setBuildings(response.data);
        }
      } catch (error) {
        console.error("Failed to refresh speedometer values:", error);
      }
    };

    loadBuildings();
    const intervalId = window.setInterval(loadBuildings, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const value = Math.min(500, buildings.length * 10);

  return (
   <div style={{padding:'100px',display:'flex',justifyContent: 'center', alignItems: 'center'}}>
     
      <ReactSpeedometer 
        value={value}
        width={500}
        height={350}
        needleColor="red"
        currentValueText={`Current Value: ${value}`}
        minValue={0}
        maxValue={500}
        startColor="green"
        segments={5}
        endColor="red"
        fontFamily='Arial'
        ringWidth={70}
        needleTransition="easeElastic"
      />
      <p>traffic Volume</p>
  
   </div>
  );
};

export default Speedometer;
