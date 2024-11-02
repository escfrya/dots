
import styles from './App.css';

// src/App.js
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three'; // Импортируем THREE

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
    });
  }
  return points;
}

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

const pointsData = generateRandomPoints(200, musicGenres);

function Point({ position, onClick, selected, label }) {
  const textRef = useRef();

  // Анимация выделения точки
  const { scale, color } = useSpring({
    scale: selected ? 1.5 : 1,
    color: selected ? 'red' : 'white',
    config: { tension: 200, friction: 15 },
  });

  return (
    <>
      <a.mesh position={position} onClick={onClick} scale={scale}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <a.meshStandardMaterial color={color} />
      </a.mesh>

      {/* Отображаем текстовую метку только если label определен */}
      {label && (
        <Text
          ref={textRef}
          position={[position[0], position[1] + 0.4, position[2]]} // Позиция над точкой
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

function Scene() {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handlePointClick = (id) => {
    setSelectedPoint(id === selectedPoint ? null : id);
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
        />
      ))}
    </>
  );
}

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 30], fov: 30 }}>
      <Scene />
    </Canvas>
  );
}

export default App;
