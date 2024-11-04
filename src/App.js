
import styles from './App.css';

// src/App.js
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';

const audioFiles = [
  '/audio/1.mp3',
  '/audio/2.mp3',
  '/audio/3.mp3',
  '/audio/4.mp3',
  '/audio/5.mp3',
  '/audio/6.mp3',
  '/audio/7.mp3',
  '/audio/8.mp3',
  '/audio/9.mp3',
];

const musicGenres = [
    "Pop",
    "Rock",
    "Hip-Hop",
    "Jazz",
    "Classical",
    "Blues",
    "Electronic",
    "Country",
    "Reggae",
    "R&B",
    "Metal",
    "Folk",
    "Punk",
    "Disco",
    "Soul",
    "Indie",
    "Gospel",
    "Latin",
    "Ska",
    "Alternative"
];

const MAX_POSITION = 20;

// Функция для генерации случайных точек с подписями для некоторых из них
function generateRandomPoints(numPoints, labels) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION
      ),
      label: i < labels.length ? labels[i] : null, // Добавляем подписи для первых нескольких точек
      frequency: Math.random() * 1 + 0.01,  // Случайная частота для каждой точки
    });
  }
  return points;
}


// Компонент точки
function Point({ point, selected, onClick, cameraPosition, amplitude }) {
  const textRef = useRef();
  const pointRef = useRef();

  // Настройка анимации позиции и других свойств с помощью useSpring
  const { scale, color, position } = useSpring({
    scale: selected ? 1.5 : 1,
    color: selected ? 'red' : 'white',
    position: point.position ? point.position.toArray() : [0, 0, 0],
    config: { tension: 200, friction: 15 },
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const waveMovement = amplitude * Math.sin(time * point.frequency);

    // Анимация перемещения точки по оси Y
    if (pointRef.current) {
      pointRef.current.position.y = position.get()[1] + waveMovement;
    }
  });

  return (
    <>
      {/* Анимированная точка */}
      <a.mesh ref={pointRef} position={position} onClick={onClick} scale={scale}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <a.meshStandardMaterial color={color} />
      </a.mesh>
      
      {/* Анимированный лейбл */}
      {point.label && (
        <a.group position={position}>
          <Text
            ref={textRef}
            position={[0, 0.4, 0]} // Смещение текста по оси Y
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {point.label}
          </Text>
        </a.group>
      )}
    </>
  );
}

// Сцена с точками
function Scene({ points, amplitude, onPointClick, selectedPoint, setSelectedPoint }) {
  const cameraPosition = new THREE.Vector3(0, 0, 30);

  const handlePointClick = (id) => {
    setSelectedPoint(id === selectedPoint ? null : id);
    // alert(selectedPoint);
    onPointClick(id === selectedPoint);
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={true} />
      {points.map((point) => (
        <Point
          key={point.id}
          point={point}
          selected={point.id === selectedPoint}
          onClick={() => handlePointClick(point.id)}
          cameraPosition={cameraPosition}
          amplitude={amplitude}
        />
      ))}
    </>
  );
}

// Главный компонент приложения
function App() {
  const [amplitude, setAmplitude] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [points, setPoints] = useState(generateRandomPoints(200, musicGenres));
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);

  const playRandomAudio = (pause) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (pause) {
      return;
    }

    const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio(randomFile);
    audio.loop = true;
    audioRef.current = audio;

    const source = audioContext.createMediaElementSource(audio);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    analyzerRef.current = analyzer;
    dataArrayRef.current = dataArray;

    audio.play();
    audioContext.resume();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (analyzerRef.current && dataArrayRef.current) {
        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
        const avgAmplitude = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / dataArrayRef.current.length;
        setAmplitude(avgAmplitude / 255);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const shufflePoints = () => {
    const newPoints = points.map((point) => ({
      ...point,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION
      ),
    }));
    setPoints(newPoints);
  };

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <button onClick={shufflePoints} style={{ position: 'absolute', top: 20, left: 20, zIndex: 1 }}>
        Reshuffle
      </button>
      <Canvas camera={{ position: [0, 0, 30], fov: 60 }} style={{ height: '100%', width: '100%' }}>
        <Scene
          points={points}
          amplitude={amplitude}
          onPointClick={playRandomAudio}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
        />
      </Canvas>
    </div>
  );
}

export default App;

