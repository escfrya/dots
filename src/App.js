
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

// Функция для генерации случайных точек с подписями для некоторых из них
function generateRandomPoints(numPoints, labels) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      id: i,
      x: (Math.random() - 0.5) * 20,  // Координаты x от -10 до 10
      y: (Math.random() - 0.5) * 20,  // Координаты y от -10 до 10
      z: (Math.random() - 0.5) * 20,  // Координаты z от -10 до 10
      label: i < labels.length ? labels[i] : null, // Добавляем подписи для первых нескольких точек
      frequency: Math.random() * 1 + 0.01,  // Случайная частота для каждой точки
    });
  }
  return points;
}

const pointsData = generateRandomPoints(200, musicGenres);

function Point({ position, onClick, selected, label, cameraPosition, frequency, amplitude }) {
  const textRef = useRef();
  const pointRef = useRef();

  const { scale, color } = useSpring({
    scale: selected ? 1.5 : 1,
    color: selected ? 'red' : 'white',
    config: { tension: 200, friction: 15 },
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (pointRef.current) {
      const waveMovement = amplitude * Math.sin(time * frequency);
      pointRef.current.position.y = position[1] + waveMovement;
    }

    if (textRef.current) {
      textRef.current.lookAt(cameraPosition);
    }
  });

  return (
    <>
      <a.mesh ref={pointRef} position={position} onClick={onClick} scale={scale}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <a.meshStandardMaterial color={color} />
      </a.mesh>

      {label && (
        <Text
          ref={textRef}
          position={[position[0], position[1] + 0.4, position[2]]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </>
  );
}

function Scene({ amplitude, onPointClick, selectedPoint, setSelectedPoint }) {
  const cameraPosition = new THREE.Vector3(0, 0, 30);

  const handlePointClick = (id) => {
    setSelectedPoint(id === selectedPoint ? null : id);
    onPointClick(); // Запуск аудио при клике на точку
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enableZoom={true} />

      {pointsData.map((point) => (
        <Point
          key={point.id}
          position={[point.x, point.y, point.z]}
          selected={point.id === selectedPoint}
          onClick={() => handlePointClick(point.id)}
          label={point.label}
          cameraPosition={cameraPosition}
          frequency={point.frequency}
          amplitude={amplitude} // Передаем амплитуду точке
        />
      ))}
    </>
  );
}

function App() {
  const [amplitude, setAmplitude] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const audioRef = useRef(null); // Ссылка на текущий аудиофайл
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);

  // Функция для воспроизведения случайного аудио
  const playRandomAudio = () => {
    // Остановим предыдущее аудио, если оно существует и воспроизводится
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Сбрасываем время до начала
    }

    // Выбираем случайный файл и создаем новый аудиоконтекст
    const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audio = new Audio(randomFile);
    audio.loop = true;
    audioRef.current = audio; // Сохраняем текущий аудиофайл в реф

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
    audioContext.resume(); // Активируем аудиоконтекст для браузеров, которые требуют взаимодействия
  };

  // Обновление амплитуды
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

  return (
    <>
      <Canvas camera={{ position: [0, 0, 30], fov: 40 }}>
        <Scene
          amplitude={amplitude}
          onPointClick={playRandomAudio} // Воспроизведение случайного аудио при нажатии на точку
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
        />
      </Canvas>
    </>
  );
}

export default App;