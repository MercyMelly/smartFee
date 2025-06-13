const feeData = [
  {
    "gradeLevel": "PP1",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 15000 },
      { "name": "Activity Fee", "amount": 2000 },
      { "name": "Medical Levy", "amount": 800 }
    ],
    "totalCalculated": 17800
  },
  {
    "gradeLevel": "PP1",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 15000 },
      { "name": "Activity Fee", "amount": 2000 },
      { "name": "Medical Levy", "amount": 800 }
    ],
    "totalCalculated": 17800
  },
  {
    "gradeLevel": "PP1",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 15000 },
      { "name": "Boarding Fee", "amount": 18000 },
      { "name": "Activity Fee", "amount": 2000 },
      { "name": "Medical Levy", "amount": 800 }
    ],
    "totalCalculated": 35800
  },
  {
    "gradeLevel": "PP2",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 17000 },
      { "name": "Activity Fee", "amount": 2200 },
      { "name": "Medical Levy", "amount": 900 }
    ],
    "totalCalculated": 20100
  },
  {
    "gradeLevel": "PP2",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 17000 },
      { "name": "Activity Fee", "amount": 2200 },
      { "name": "Medical Levy", "amount": 900 }
    ],
    "totalCalculated": 20100
  },
  {
    "gradeLevel": "PP2",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 17000 },
      { "name": "Boarding Fee", "amount": 20000 },
      { "name": "Activity Fee", "amount": 2200 },
      { "name": "Medical Levy", "amount": 900 }
    ],
    "totalCalculated": 40100
  },
  {
    "gradeLevel": "Grade 1",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 25000 },
      { "name": "Activity Fee", "amount": 3000 },
      { "name": "Medical Levy", "amount": 1000 }
    ],
    "totalCalculated": 29000
  },
  {
    "gradeLevel": "Grade 1",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 25000 },
      { "name": "Activity Fee", "amount": 3000 },
      { "name": "Medical Levy", "amount": 1000 }
    ],
    "totalCalculated": 29000
  },
  {
    "gradeLevel": "Grade 1",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 35000 },
      { "name": "Boarding Fee", "amount": 20000 },
      { "name": "Activity Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 1500 }
    ],
    "totalCalculated": 60500
  },
  {
    "gradeLevel": "Grade 2",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 27000 },
      { "name": "Activity Fee", "amount": 3200 },
      { "name": "Medical Levy", "amount": 1100 }
    ],
    "totalCalculated": 31300
  },
  {
    "gradeLevel": "Grade 2",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 27000 },
      { "name": "Activity Fee", "amount": 3200 },
      { "name": "Medical Levy", "amount": 1100 }
    ],
    "totalCalculated": 31300
  },
  {
    "gradeLevel": "Grade 2",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 37000 },
      { "name": "Boarding Fee", "amount": 22000 },
      { "name": "Activity Fee", "amount": 4200 },
      { "name": "Medical Levy", "amount": 1600 }
    ],
    "totalCalculated": 64800
  },
  {
    "gradeLevel": "Grade 3",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 29000 },
      { "name": "Activity Fee", "amount": 3400 },
      { "name": "Medical Levy", "amount": 1200 }
    ],
    "totalCalculated": 33600
  },
  {
    "gradeLevel": "Grade 3",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 29000 },
      { "name": "Activity Fee", "amount": 3400 },
      { "name": "Medical Levy", "amount": 1200 }
    ],
    "totalCalculated": 33600
  },
  {
    "gradeLevel": "Grade 3",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 39000 },
      { "name": "Boarding Fee", "amount": 24000 },
      { "name": "Activity Fee", "amount": 4400 },
      { "name": "Medical Levy", "amount": 1700 }
    ],
    "totalCalculated": 69100
  },
  {
    "gradeLevel": "Grade 4",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 32000 },
      { "name": "Activity Fee", "amount": 3700 },
      { "name": "Medical Levy", "amount": 1300 }
    ],
    "totalCalculated": 37000
  },
  {
    "gradeLevel": "Grade 4",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 32000 },
      { "name": "Activity Fee", "amount": 3700 },
      { "name": "Medical Levy", "amount": 1300 }
    ],
    "totalCalculated": 37000
  },
  {
    "gradeLevel": "Grade 4",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 42000 },
      { "name": "Boarding Fee", "amount": 27000 },
      { "name": "Activity Fee", "amount": 4700 },
      { "name": "Medical Levy", "amount": 1800 }
    ],
    "totalCalculated": 75500
  },
  {
    "gradeLevel": "Grade 5",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 35000 },
      { "name": "Activity Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 1400 }
    ],
    "totalCalculated": 40400
  },
  {
    "gradeLevel": "Grade 5",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 35000 },
      { "name": "Activity Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 1400 }
    ],
    "totalCalculated": 40400
  },
  {
    "gradeLevel": "Grade 5",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 45000 },
      { "name": "Boarding Fee", "amount": 30000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 1900 }
    ],
    "totalCalculated": 81900
  },
  {
    "gradeLevel": "Grade 6",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 38000 },
      { "name": "Activity Fee", "amount": 4300 },
      { "name": "Medical Levy", "amount": 1500 }
    ],
    "totalCalculated": 43800
  },
  {
    "gradeLevel": "Grade 6",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 38000 },
      { "name": "Activity Fee", "amount": 4300 },
      { "name": "Medical Levy", "amount": 1500 }
    ],
    "totalCalculated": 43800
  },
  {
    "gradeLevel": "Grade 6",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 48000 },
      { "name": "Boarding Fee", "amount": 33000 },
      { "name": "Activity Fee", "amount": 5300 },
      { "name": "Medical Levy", "amount": 2000 }
    ],
    "totalCalculated": 88300
  },
  {
    "gradeLevel": "Grade 7",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 42000 },
      { "name": "Activity Fee", "amount": 4700 },
      { "name": "Medical Levy", "amount": 1600 },
      { "name": "Exam Fee", "amount": 2000 }
    ],
    "totalCalculated": 50300
  },
  {
    "gradeLevel": "Grade 7",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 42000 },
      { "name": "Activity Fee", "amount": 4700 },
      { "name": "Medical Levy", "amount": 1600 },
      { "name": "Exam Fee", "amount": 2000 }
    ],
    "totalCalculated": 50300
  },
  {
    "gradeLevel": "Grade 7",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 52000 },
      { "name": "Boarding Fee", "amount": 36000 },
      { "name": "Activity Fee", "amount": 5700 },
      { "name": "Medical Levy", "amount": 2100 },
      { "name": "Exam Fee", "amount": 2000 }
    ],
    "totalCalculated": 97800
  },
  {
    "gradeLevel": "Grade 8",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 45000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 1700 },
      { "name": "Exam Fee", "amount": 2500 }
    ],
    "totalCalculated": 54200
  },
  {
    "gradeLevel": "Grade 8",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 45000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 1700 },
      { "name": "Exam Fee", "amount": 2500 }
    ],
    "totalCalculated": 54200
  },
  {
    "gradeLevel": "Grade 8",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 55000 },
      { "name": "Boarding Fee", "amount": 39000 },
      { "name": "Activity Fee", "amount": 6000 },
      { "name": "Medical Levy", "amount": 2200 },
      { "name": "Exam Fee", "amount": 2500 }
    ],
    "totalCalculated": 104700
  },
  {
    "gradeLevel": "Grade 9",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 60000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Exam Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 2000 }
    ],
    "totalCalculated": 71000
  },
  {
    "gradeLevel": "Grade 9",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 60000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Exam Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 2000 }
    ],
    "totalCalculated": 71000
  },
  {
    "gradeLevel": "Grade 9",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 60000 },
      { "name": "Boarding Fee", "amount": 40000 },
      { "name": "Activity Fee", "amount": 5000 },
      { "name": "Exam Fee", "amount": 4000 },
      { "name": "Medical Levy", "amount": 2000 }
    ],
    "totalCalculated": 111000
  },
  {
    "gradeLevel": "Grade 10",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 65000 },
      { "name": "Activity Fee", "amount": 5500 },
      { "name": "Exam Fee", "amount": 4500 },
      { "name": "Medical Levy", "amount": 2200 }
    ],
    "totalCalculated": 77200
  },
  {
    "gradeLevel": "Grade 10",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 65000 },
      { "name": "Activity Fee", "amount": 5500 },
      { "name": "Exam Fee", "amount": 4500 },
      { "name": "Medical Levy", "amount": 2200 }
    ],
    "totalCalculated": 77200
  },
  {
    "gradeLevel": "Grade 10",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 65000 },
      { "name": "Boarding Fee", "amount": 45000 },
      { "name": "Activity Fee", "amount": 5500 },
      { "name": "Exam Fee", "amount": 4500 },
      { "name": "Medical Levy", "amount": 2200 }
    ],
    "totalCalculated": 122200
  },
  {
    "gradeLevel": "Grade 11",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 70000 },
      { "name": "Activity Fee", "amount": 6000 },
      { "name": "Exam Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 2400 }
    ],
    "totalCalculated": 83400
  },
  {
    "gradeLevel": "Grade 11",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 70000 },
      { "name": "Activity Fee", "amount": 6000 },
      { "name": "Exam Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 2400 }
    ],
    "totalCalculated": 83400
  },
  {
    "gradeLevel": "Grade 11",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 70000 },
      { "name": "Boarding Fee", "amount": 50000 },
      { "name": "Activity Fee", "amount": 6000 },
      { "name": "Exam Fee", "amount": 5000 },
      { "name": "Medical Levy", "amount": 2400 }
    ],
    "totalCalculated": 133400
  },
  {
    "gradeLevel": "Grade 12",
    "boardingStatus": "Day",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 75000 },
      { "name": "Activity Fee", "amount": 6500 },
      { "name": "Exam Fee", "amount": 5500 },
      { "name": "Medical Levy", "amount": 2600 }
    ],
    "totalCalculated": 89600
  },
  {
    "gradeLevel": "Grade 12",
    "boardingStatus": "Day",
    "hasTransport": true,
    "transportRoutes": {
      "senetwo": 3000,
      "maraba": 5000,
      "songhor": 9000,
      "kamelilo": 12000
    },
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 75000 },
      { "name": "Activity Fee", "amount": 6500 },
      { "name": "Exam Fee", "amount": 5500 },
      { "name": "Medical Levy", "amount": 2600 }
    ],
    "totalCalculated": 89600
  },
  {
    "gradeLevel": "Grade 12",
    "boardingStatus": "Boarding",
    "hasTransport": false,
    "transportRoute": "", // Added
    "termlyComponents": [
      { "name": "Tuition Fee", "amount": 75000 },
      { "name": "Boarding Fee", "amount": 55000 },
      { "name": "Activity Fee", "amount": 6500 },
      { "name": "Exam Fee", "amount": 5500 },
      { "name": "Medical Levy", "amount": 2600 }
    ],
    "totalCalculated": 144600
  }
];
