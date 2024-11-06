import styles from './App.css';

import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  "Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Blues", "Electronic", "Country", "Reggae", "R&B",
  "Metal", "Folk", "Punk", "Disco", "Soul", "Indie", "Gospel", "Latin", "Ska", "Alternative"
];

const segments = ['vocal', 'melody', 'bass', 'drums'];

const redColor = new THREE.Color("#F44336").convertSRGBToLinear();
const whiteColor = new THREE.Color("#FFFFFF").convertSRGBToLinear();
const blueColor = new THREE.Color("#E3F2FD").convertSRGBToLinear();

const MAX_POSITION = 20;
const NUM_POINTS = 100;

function generateRandomPoints(numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push({
      id: i,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION
      ),
      timeOffset: Math.random() * 10,
      color1: blueColor,
      color2: whiteColor,
      label: i < musicGenres.length ? musicGenres[i] : null,
      frequency: Math.random() * 1 + 0.01,
    });
  }
  return points;
}

const AnimatedGradientMaterial = ({ color1, color2, timeOffset }) => {
  const materialRef = useRef();

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color1.value = color1;
      materialRef.current.uniforms.color2.value = color2;
    }
  }, [color1, color2]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime() + timeOffset;
    }
  });

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    color1: { value: color1 },
    color2: { value: color2 },
  }), []);

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;

        void main() {
          float radialGradient = length(vUv - 0.5) * 2.0;
          float animatedGradient = sin(time + radialGradient * 5.0) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, animatedGradient);
          gl_FragColor = vec4(color, 1.0);
        }
      `}
      uniforms={uniforms}
    />
  );
};

function Point({ point, selected, onClick, amplitude, visible, showLabels }) {
  const pointRef = useRef();

  const initialPosition = point.position;

  const { scale, position } = useSpring({
    scale: selected ? 2.0 : 1,
    position: visible ? initialPosition.toArray() : [0, 0, 0],
    config: { tension: 200, friction: 15 },
  });

  const { labelPosition } = useSpring({
    labelPosition: visible ? initialPosition.toArray() : [0, 0, 0],
    config: { tension: 200, friction: 15 },
  });

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const waveMovement = amplitude * Math.sin(time * point.frequency);

    if (pointRef.current) {
      pointRef.current.position.y = position.get()[1] + waveMovement;
    }
  });

  return (
    <>
      <a.mesh ref={pointRef} position={position} onClick={onClick} scale={scale} visible={visible}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <AnimatedGradientMaterial 
          color1={selected ? redColor : point.color1} 
          color2={point.color2}
          timeOffset={point.timeOffset}
        />
      </a.mesh>

      {point.label && showLabels && (
        <a.mesh position={labelPosition}>
          <Text
            position={[0, 0.4, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {point.label}
          </Text>
        </a.mesh>
      )}
    </>
  );
}

function MovingSphere({ color, size }) {
  const sphereRef = useRef();

  // Генерация случайных начальных позиций для каждой сферы
  const initialPosition = useMemo(() => ({
    x: (Math.random() - 0.5) * 20, // Случайное значение между -10 и 10
    y: (Math.random() - 0.5) * 20, // Случайное значение между -10 и 10
    z: (Math.random() - 0.5) * 20, // Случайное значение между -10 и 10
  }), []);

  // Устанавливаем начальную, более медленную скорость
  const initialSpeed = useMemo(() => ({
    x: Math.random() * 0.01 + 0.005,
    y: Math.random() * 0.01 + 0.005,
    z: Math.random() * 0.01 + 0.005,
  }), []);

  const [currentSpeed, setCurrentSpeed] = useState(initialSpeed);
  const [targetSpeed, setTargetSpeed] = useState(initialSpeed);

  const radius = 12;

  // Функция для генерации случайной скорости
  const generateRandomSpeed = () => ({
    x: Math.random() * 0.01 + 0.005,
    y: Math.random() * 0.01 + 0.005,
    z: Math.random() * 0.01 + 0.005,
  });

  // Функция для генерации случайного направления
  const getRandomDirection = () => ({
    x: Math.random() > 0.5 ? 1 : -1,
    y: Math.random() > 0.5 ? 1 : -1,
    z: Math.random() > 0.5 ? 1 : -1,
  });

  const [currentDirection, setCurrentDirection] = useState(getRandomDirection());
  const [targetDirection, setTargetDirection] = useState(getRandomDirection);

  useEffect(() => {
    const interval = setInterval(() => {
      setTargetDirection(getRandomDirection());
      setTargetSpeed(generateRandomSpeed());
    }, 10000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Плавно изменяем текущее направление и скорость к целевым значениям
    currentDirection.x = THREE.MathUtils.lerp(currentDirection.x, targetDirection.x, 0.01);
    currentDirection.y = THREE.MathUtils.lerp(currentDirection.y, targetDirection.y, 0.01);
    currentDirection.z = THREE.MathUtils.lerp(currentDirection.z, targetDirection.z, 0.01);

    currentSpeed.x = THREE.MathUtils.lerp(currentSpeed.x, targetSpeed.x, 0.01);
    currentSpeed.y = THREE.MathUtils.lerp(currentSpeed.y, targetSpeed.y, 0.01);
    currentSpeed.z = THREE.MathUtils.lerp(currentSpeed.z, targetSpeed.z, 0.01);

    // Плавное движение по заданной траектории
    if (sphereRef.current) {
      sphereRef.current.position.x = initialPosition.x + radius * Math.sin(time * currentSpeed.x) * currentDirection.x;
      sphereRef.current.position.y = initialPosition.y + radius * Math.cos(time * currentSpeed.y) * currentDirection.y * 0.5;
      sphereRef.current.position.z = initialPosition.z + radius * Math.sin(time * currentSpeed.z) * currentDirection.z;
    }
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial color={color} opacity={0.2} transparent />
    </mesh>
  );
}

function Scene({ points, amplitude, onPointClick, selectedPoint, setSelectedPoint, showPoints, showLabels, showUsers }) {
  const handlePointClick = (id) => {
    setSelectedPoint(id === selectedPoint ? null : id);
    onPointClick(id === selectedPoint);
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} />

      {showUsers && (
        <>
          <MovingSphere color="#FF6347" size={0.7} />
          <MovingSphere color="#FFFF00" size={0.7} />
          <MovingSphere color="#32CD32" size={0.7} />
        </>
      )}

      {points.map((point) => (
        <Point
          key={point.id}
          point={point}
          selected={point.id === selectedPoint}
          onClick={() => handlePointClick(point.id)}
          amplitude={amplitude}
          visible={showPoints}
          showLabels={showLabels}
        />
      ))}
    </>
  );
}

function App() {
  const [amplitude, setAmplitude] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [points, setPoints] = useState(generateRandomPoints(NUM_POINTS));
  const [showPoints, setShowPoints] = useState(false);
  const [showBigSphere, setShowBigSphere] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(segments[0]);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const dataArrayRef = useRef(null);
  const canvasRef = useRef();

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

  const reshaffle = () => {
    points.forEach(point => {
      point.position = new THREE.Vector3(
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION,
        (Math.random() - 0.5) * MAX_POSITION
      );
    });
  };

  const showUsersByTimer = () => {
    const interval = setTimeout(() => {
      setShowUsers(true);
    }, 0.5*1000);
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

  const handleBigSphereClick = () => {
    setShowBigSphere(false);
    setShowPoints(true);
    setShowLabels(true);
    showUsersByTimer();
  };

  const handleSegmentClick = (segment) => {
    setSelectedSegment(segment);
    reshaffle();
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Canvas ref={canvasRef} camera={{ position: [0, 0, 30], fov: 35 }} style={{ height: '100%', width: '100%' }}>
        {canvasRef.current && <OrbitControls enableZoom={true} />}
        {showBigSphere && (
          <>
            <mesh onClick={handleBigSphereClick}>
              <sphereGeometry args={[5, 64, 64]} />
              <meshStandardMaterial color={whiteColor} />
            </mesh>

            <Text
              position={[0, -7, 0]}
              fontSize={4.0}
              color="white" 
              anchorX="center"
              anchorY="middle"
            >
              megatrack
            </Text>
          </>
        )}
        <Scene
          points={points}
          amplitude={amplitude}
          onPointClick={playRandomAudio}
          selectedPoint={selectedPoint}
          setSelectedPoint={setSelectedPoint}
          showPoints={showPoints}
          showLabels={showLabels}
          showUsers={showUsers}
        />
      </Canvas>

      {showPoints && (
        <div id="segment" className="segmented-control">
          {segments.map((segment) => (
            <button
              key={segment}
              onClick={() => handleSegmentClick(segment)}
              style={{
                backgroundColor: selectedSegment === segment ? '#F44336' : '#E3F2FD',
                color: selectedSegment === segment ? 'white' : 'black',
                fontWeight: selectedSegment === segment ? 'bold' : 'normal',
                border: 'none',
                padding: '10px 20px',
                margin: '5px',
                borderRadius: '5px',
              }}
            >
              {segment.charAt(0).toUpperCase() + segment.slice(1)} 
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
