const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function buildAllAcademicPdfs() {
  console.log('Generating authentic academic PDFs for KLU VSS...');

  // Helper function to build a standardized 2-page academic PDF
  async function generateAcademicPdf({
    fileName,
    deptText = 'KL UNIVERSITY · DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    courseText,
    title,
    page1Sections,
    page2Header,
    page2Sections,
  }) {
    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    // PAGE 1
    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 58,
      width: width,
      height: 58,
      color: rgb(0.07, 0.11, 0.2),
    });

    page.drawText(deptText, {
      x: 35,
      y: height - 26,
      size: 8.5,
      font: fontBold,
      color: rgb(0.75, 0.85, 1.0),
    });

    page.drawText(courseText, {
      x: 35,
      y: height - 42,
      size: 8,
      font: fontRegular,
      color: rgb(0.65, 0.75, 0.9),
    });

    // Title
    page.drawText(title, {
      x: 35,
      y: height - 88,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.12, 0.18),
    });

    page.drawLine({
      start: { x: 35, y: height - 98 },
      end: { x: width - 35, y: height - 98 },
      thickness: 1.5,
      color: rgb(0.55, 0.35, 0.95),
    });

    let y = height - 120;

    for (const sec of page1Sections) {
      page.drawText(sec.heading, {
        x: 35,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.35, 0.2, 0.7),
      });
      y -= 16;
      for (const line of sec.lines) {
        const isCode = Boolean(sec.isCode);
        page.drawText(line, {
          x: isCode ? 48 : 42,
          y,
          size: isCode ? 8.5 : 9,
          font: isCode ? fontMono : fontRegular,
          color: isCode ? rgb(0.1, 0.15, 0.25) : rgb(0.18, 0.18, 0.22),
        });
        y -= 13.5;
      }
      y -= 8;
    }

    // Page 1 Footer
    page.drawText('Page 1 of 2 · Virtual Student Space (VSS) · https://klu-vss.vercel.app', {
      x: 35,
      y: 24,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // PAGE 2
    page = pdfDoc.addPage([595, 842]);
    page.drawRectangle({
      x: 0,
      y: height - 40,
      width: width,
      height: 40,
      color: rgb(0.07, 0.11, 0.2),
    });

    page.drawText(page2Header, {
      x: 35,
      y: height - 25,
      size: 9,
      font: fontBold,
      color: rgb(0.75, 0.85, 1.0),
    });

    y = height - 65;

    for (const sec of page2Sections) {
      page.drawText(sec.heading, {
        x: 35,
        y,
        size: 11,
        font: fontBold,
        color: rgb(0.35, 0.2, 0.7),
      });
      y -= 16;
      for (const line of sec.lines) {
        const isCode = Boolean(sec.isCode);
        page.drawText(line, {
          x: isCode ? 48 : 42,
          y,
          size: isCode ? 8.5 : 9,
          font: isCode ? fontMono : fontRegular,
          color: isCode ? rgb(0.1, 0.15, 0.25) : rgb(0.18, 0.18, 0.22),
        });
        y -= 13.5;
      }
      y -= 8;
    }

    // Page 2 Footer
    page.drawText('Page 2 of 2 · Virtual Student Space (VSS) · Verified Academic Material', {
      x: 35,
      y: 24,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(`public/samples/${fileName}`, pdfBytes);
    console.log(`✓ Saved public/samples/${fileName} (${pdfBytes.length} bytes)`);
  }

  // 1. DTIE Stanford 5-Stage Innovation Portfolio
  await generateAcademicPdf({
    fileName: '26UC1137_DTIE_Phase1_to_5_Portfolio.pdf',
    deptText: 'KL UNIVERSITY · CENTER FOR INNOVATION, INCUBATION & ENTREPRENEURSHIP',
    courseText: 'Course: 26UC1137 - DESIGN THINKING FOR INNOVATION & ENTREPRENEURSHIP (DTIE)',
    title: 'DTIE Stanford 5-Stage Portfolio: Campus IoT Cooler',
    page1Sections: [
      {
        heading: 'STAGE 1: EMPATHIZE (Field Research & User Need Identification)',
        lines: [
          '• Target Group: 12,000+ KLU day-scholars and hostelers transitioning between academic blocks.',
          '• Primary Problem Statement: Extreme 43°C ambient temperature during peak campus transition hours (12 PM - 3 PM).',
          '• 50+ In-person interviews conducted at SAC, C-Block walkways, and Central Library lawn.',
          '• Empathy Map Insight: "Walking 800m across open pavement leads to acute dehydration and heat exhaustion."',
        ],
      },
      {
        heading: 'STAGE 2: DEFINE (Point of View & Problem Reframing)',
        lines: [
          '• User: KLU B.Tech engineering student walking between classrooms during mid-day transition.',
          '• Need: An automated, rapid evaporative cooling station that provides instant thermal relief without drenching clothes.',
          '• Insight: Traditional outdoor mist fans waste excessive water and spray high-pressure droplets uncomfortably.',
          '• POV Statement: "Hostel day-scholars need localized dry-mist evaporative cooling stations to prevent thermal heat exhaustion."',
        ],
      },
      {
        heading: 'STAGE 3: IDEATE (SCAMPER Matrix & Concept Selection)',
        lines: [
          '• Substitute: Replaced high-pressure water pump with low-voltage ultrasonic piezo atomizer.',
          '• Combine: Integrated solar PV rooftop canopy with PIR motion-activated misting.',
          '• Adapt: Utilized Peltier thermo-electric pre-chiller to lower mist temperature by 5°C below ambient.',
          '• Selected Concept: Peltier-Assisted Solar Dry-Mist Station with ESP32 occupancy detection.',
        ],
      },
    ],
    page2Header: '26UC1137 DTIE PORTFOLIO · PROTOTYPING, CAD & TESTING RESULTS',
    page2Sections: [
      {
        heading: 'STAGE 4: PROTOTYPE (CAD Architecture & Component BOM)',
        lines: [
          '• Chassis: Laser-cut acrylic weather-resistant housing (Autodesk Fusion 360 rendered).',
          '• Controller: ESP32 micro-controller board with dual-core 240MHz Tensilica CPU.',
          '• Sensors: DHT22 (temperature/humidity) + HC-SR501 PIR sensor for automatic trigger upon student presence.',
          '• Power System: 50W Monocrystalline solar panel + 12V 7Ah LiFePO4 battery pack with MPPT charge controller.',
          '• Bill of Materials (BOM): Total prototype cost INR 3,850 (Commercial market alternatives: INR 18,000+).',
        ],
      },
      {
        heading: 'STAGE 5: TEST (Validation Metrics & Field Deployment)',
        lines: [
          '• Test Site: Main walkway connecting Fed-Ex lawn and SAC building at KLU Vaddeswaram campus.',
          '• Ambient Baseline: 42.8°C with 38% relative humidity.',
          '• Cooled Zone Metric: 36.4°C within a 2.5-meter radius (6.4°C localized ambient reduction).',
          '• Water Efficiency: 180 ml per minute vs 1,200 ml per minute in commercial mist towers.',
          '• Student Feedback: 96% positive response across 140 recorded field survey responses.',
        ],
      },
    ],
  });

  // 2. DTIE Project Report: Smart Campus Cooler
  await generateAcademicPdf({
    fileName: 'DTIE_Smart_Campus_Cooler_Report.pdf',
    deptText: 'KL UNIVERSITY · B.TECH Y26/Y25 ACADEMIC CURRICULUM PROJECT REPORT',
    courseText: 'Course: 26UC1137 - DESIGN THINKING & PROJECT-BASED LEARNING',
    title: 'Smart Campus Cooler & Air Purifier: Engineering Report',
    page1Sections: [
      {
        heading: '1. EXECUTIVE SUMMARY & PROJECT SCOPE',
        lines: [
          '• Project Title: Smart Campus Solar-Powered Air Purifier & Heat Island Mitigator.',
          '• Objective: Mitigate micro-climate heat islands across open campus walkways using clean solar energy.',
          '• Architecture: Closed-loop IoT station featuring ultrasonic piezo misting, HEPA H13 filtration, and telemetry.',
          '• Sustainability: 100% off-grid operation utilizing rooftop solar PV and LiFePO4 energy storage.',
        ],
      },
      {
        heading: '2. ENGINEERING SYSTEM ARCHITECTURE',
        lines: [
          '• Sensing Layer: Sensirion SPS30 Optical PM2.5/PM10 Sensor + Bosch BME280 Ambient Sensor.',
          '• Actuation Layer: 24V DC Brushless Centrifugal Blower + 113kHz Ultrasonic Atomization Discs.',
          '• IoT Connectivity: ESP32 WiFi/Bluetooth gateway transmitting real-time AQI and temperature data to VSS.',
          '• Enclosure Design: Anodized aluminum 6061 frame with IP65 moisture-sealed electronics compartment.',
        ],
      },
    ],
    page2Header: 'DTIE PROJECT REPORT · SCHEMATICS, TELEMETRY & BOM ANALYSIS',
    page2Sections: [
      {
        heading: '3. PERFORMANCE EVALUATION & BENCHMARKING',
        lines: [
          '• Particulate Filtration: Reduced ambient PM2.5 levels from 142 ug/m3 to 22 ug/m3 (84.5% efficiency).',
          '• Thermal Dissipation: 6.2°C dry-bulb temperature depression within 90 seconds of student arrival.',
          '• Daily Energy Consumption: 180 Watt-hours per 10-hour campus daytime operating window.',
          '• Solar Generation: 260 Watt-hours average daily yield (44% surplus energy stored in backup battery).',
        ],
      },
      {
        heading: '4. CONCLUSION & UNIVERSITY SCALABILITY ROADMAP',
        lines: [
          '• Academic Review Rating: Awarded Grade A+ in departmental innovation showcase review.',
          '• Recommended Campus Rollout: 12 modular stations situated along SAC, Indoor Stadium, and C-Block corridors.',
          '• Patent Status: Provisional Indian Patent Filed under Student Innovation Track (Ref: KLU-CIIE-2026-089).',
        ],
      },
    ],
  });

  // 3. AVL Trees Lab Record
  await generateAcademicPdf({
    fileName: '23CS2101_Exp5_AVL_Trees_LabRecord.pdf',
    deptText: 'KL UNIVERSITY · DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    courseText: 'Course: 23CS2101 - DATA STRUCTURES & ALGORITHMS LABORATORY',
    title: 'Lab Exp 5: AVL Tree Rotations & Balancing Observations',
    page1Sections: [
      {
        heading: 'AIM & THEORETICAL FOUNDATION',
        lines: [
          '• Aim: Implement Self-Balancing Binary Search Tree (AVL Tree) and verify LL, RR, LR, RL rotations.',
          '• Balance Factor (BF): BF(node) = height(left_subtree) - height(right_subtree). Invariant: BF in {-1, 0, +1}.',
          '• Rotation Cases:',
          '  - Left-Left (LL): Single Right Rotation about node Z.',
          '  - Right-Right (RR): Single Left Rotation about node Z.',
          '  - Left-Right (LR): Left Rotation on child Y, followed by Right Rotation on node Z.',
          '  - Right-Left (RL): Right Rotation on child Y, followed by Left Rotation on node Z.',
        ],
      },
      {
        heading: 'ALGORITHM IMPLEMENTATION DETAILS',
        lines: [
          '• Node Structure: Contains integer key, left/right pointers, and cached height integer.',
          '• Height Update: node.height = 1 + max(height(node.left), height(node.right)).',
          '• Insertion Time Complexity: O(log N) worst-case vs O(N) in unbalanced degenerate BST.',
          '• Space Complexity: O(log N) auxiliary recursion stack space.',
        ],
      },
    ],
    page2Header: '23CS2101 LAB EXP 5 · C IMPLEMENTATION & TEST CASE OBSERVATIONS',
    page2Sections: [
      {
        heading: 'CORE ROTATION IMPLEMENTATION (C LANGUAGE)',
        lines: [
          'Node* rightRotate(Node* y) {',
          '    Node* x = y->left;  Node* T2 = x->right;',
          '    x->right = y;  y->left = T2;',
          '    y->height = max(height(y->left), height(y->right)) + 1;',
          '    x->height = max(height(x->left), height(x->right)) + 1;',
          '    return x; // New root',
          '}',
          'Node* leftRotate(Node* x) {',
          '    Node* y = x->right; Node* T2 = y->left;',
          '    y->left = x;  x->right = T2;',
          '    x->height = max(height(x->left), height(x->right)) + 1;',
          '    y->height = max(height(y->left), height(y->right)) + 1;',
          '    return y; // New root',
          '}',
        ],
        isCode: true,
      },
      {
        heading: 'INPUT TEST SEQUENCE & LAB VIVA OBSERVATIONS',
        lines: [
          '• Insert Sequence: [10, 20, 30, 40, 50, 25].',
          '• Observations:',
          '  - Insertion of 30 triggers RR imbalance at node 10 -> Left Rotation restores balance.',
          '  - Insertion of 50 triggers RR imbalance at node 30 -> Left Rotation restores balance.',
          '  - Insertion of 25 triggers RL imbalance at node 40 -> Right-Left double rotation executed.',
          '• Final In-Order Traversal: 10, 20, 25, 30, 40, 50 (Strictly Sorted).',
          '• Faculty Sign-off: Verified & Certified by Lab Examiner with full 10/10 marks.',
        ],
      },
    ],
  });

  // 4. Discrete Mathematics Notes
  await generateAcademicPdf({
    fileName: '23MT2001_Discrete_Maths_Unit2_Unit3_Notes.pdf',
    deptText: 'KL UNIVERSITY · DEPARTMENT OF MATHEMATICS · B.TECH CURRICULUM',
    courseText: 'Course: 23MT2001 - DISCRETE MATHEMATICS & GRAPH THEORY',
    title: 'Unit 2 & 3 Notes: Recurrence Relations & Graph Theory',
    page1Sections: [
      {
        heading: 'UNIT 2: COMBINATORICS & RECURRENCE RELATIONS',
        lines: [
          '• Generalized Pigeonhole Principle: If N objects are placed into k boxes, then at least one box contains ceil(N/k) objects.',
          '• Characteristic Root Method for Linear Homogeneous Recurrence Relations:',
          '  - Given: a_n + c1*a_{n-1} + c2*a_{n-2} = 0 -> Characteristic equation: r^2 + c1*r + c2 = 0.',
          '  - Distinct Real Roots (r1 != r2): a_n = A*(r1)^n + B*(r2)^n.',
          '  - Repeated Roots (r1 = r2 = r): a_n = (A + B*n)*(r)^n.',
          '• Generating Functions: G(x) = sum(a_n * x^n). Used for solving partitions and non-homogeneous relations.',
        ],
      },
      {
        heading: 'SOLVED END-SEM PYQ: SOLVING FIBONACCI RECURRENCE',
        lines: [
          '• Problem: Solve a_n = a_{n-1} + a_{n-2} with a_0 = 0, a_1 = 1.',
          '• Characteristic Equation: r^2 - r - 1 = 0 -> Roots: r = (1 +/- sqrt(5)) / 2.',
          '• General Solution: a_n = A*((1+sqrt(5))/2)^n + B*((1-sqrt(5))/2)^n.',
          '• Applying initial conditions yields Binet\'s Formula: a_n = (1/sqrt(5))*[phi^n - psi^n]. Q.E.D.',
        ],
      },
    ],
    page2Header: '23MT2001 DISCRETE MATHS · GRAPH THEORY & EULER/HAMILTONIAN PATHS',
    page2Sections: [
      {
        heading: 'UNIT 3: GRAPH THEORY THEOREMS & PROPERTIES',
        lines: [
          '• Handshaking Lemma: sum(deg(v)) = 2*|E|. Corollary: In any graph, the number of odd-degree vertices is always even.',
          '• Euler Graph Theorem: A connected graph G has an Euler Circuit if and only if every vertex has an EVEN degree.',
          '  - Euler Path: Exactly TWO vertices have odd degree (path starts at one and ends at the other).',
          '• Hamiltonian Cycle: A closed loop that visits every vertex exactly once.',
          '  - Dirac\'s Theorem: If |V| >= 3 and deg(v) >= |V|/2 for all v, then G is Hamiltonian.',
          '  - Ore\'s Theorem: If |V| >= 3 and deg(u) + deg(v) >= |V| for every non-adjacent pair (u, v), G is Hamiltonian.',
        ],
      },
      {
        heading: 'PLANARITY & COLORING (FOUR COLOR THEOREM)',
        lines: [
          '• Euler\'s Planar Formula: V - E + R = 2 for any connected planar graph.',
          '• Kuratowski\'s Theorem: A graph is planar iff it contains no subgraph homeomorphic to K5 or K3,3.',
          '• Chromatic Number chi(G): Minimum colors required to color vertices such that no two adjacent vertices share color.',
          '  - Complete Graph Kn: chi(Kn) = n. Bipartite Graph: chi(G) = 2. Tree: chi(T) = 2.',
        ],
      },
    ],
  });

  // 5. Wireshark Network Packet Analysis Lab 4
  await generateAcademicPdf({
    fileName: '23CS3309_Wireshark_TCP_Handshake_Analysis.pdf',
    deptText: 'KL UNIVERSITY · DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    courseText: 'Course: 23CS3309 - COMPUTER NETWORKS & PROTOCOLS LABORATORY',
    title: 'Lab 4: Wireshark TCP 3-Way Handshake & Flow Analysis',
    page1Sections: [
      {
        heading: '1. OBJECTIVE & LAB ENVIRONMENT CONFIGURATION',
        lines: [
          '• Aim: Capture and inspect TCP packets using Wireshark to analyze the 3-Way Handshake and 4-Way Teardown.',
          '• Capture Interface: Wi-Fi (802.11ac) / Ethernet adapter set to promiscuous mode.',
          '• Display Filter Applied: `tcp.port == 80 || tcp.port == 443 || ip.addr == 115.240.247.10` (KLU Campus Server).',
          '• Protocol Stack: Layer 3 IPv4 -> Layer 4 Transmission Control Protocol (TCP) -> Layer 7 HTTP/TLS.',
        ],
      },
      {
        heading: '2. THE TCP 3-WAY HANDSHAKE DECONSTRUCTION',
        lines: [
          '• Step 1: Client -> Server [SYN]',
          '  - Flags: 0x002 (SYN set). Sequence Number: Seq = 0 (Relative) / 2841920381 (Raw 32-bit ISN).',
          '  - Options: Maximum Segment Size (MSS) = 1460 bytes, Window Scale = 8 (Multiplier 256), SACK Permitted = 1.',
          '• Step 2: Server -> Client [SYN, ACK]',
          '  - Flags: 0x012 (SYN, ACK set). Seq = 0 (Relative), Acknowledgment Number: Ack = 1 (Relative: Client ISN + 1).',
          '• Step 3: Client -> Server [ACK]',
          '  - Flags: 0x010 (ACK set). Seq = 1, Ack = 1. Connection established state: ESTABLISHED.',
        ],
      },
    ],
    page2Header: '23CS3309 COMPUTER NETWORKS · PACKET DECODE & OBSERVATIONS',
    page2Sections: [
      {
        heading: '3. TCP SEGMENT HEADER FIELD DECODE',
        lines: [
          '• Source Port: 54182 (Ephemeral Client Port) | Destination Port: 443 (HTTPS Secure Web Server).',
          '• Sequence Number: 32-bit identifier ensuring reliable in-order byte-stream delivery.',
          '• Window Size: 65,535 bytes with scaling factor 256 -> Calculated Window = 16,776,960 bytes (High Throughput).',
          '• Checksum: 0x7a3e [Correct validation]. Urgent Pointer: 0x0000 (No urgent out-of-band data).',
        ],
      },
      {
        heading: '4. LAB VIVA QUESTIONS & KEY TAKEAWAYS',
        lines: [
          '• Q: Why does TCP use SYN+1 for the ACK number rather than SYN+0?',
          '  - A: The SYN flag consumes 1 virtual sequence number byte to guarantee reliable delivery of the control signal.',
          '• Q: What happens during TCP 4-Way Teardown?',
          '  - A: Client sends FIN -> Server sends ACK -> Server finishes sending data -> Server sends FIN -> Client sends ACK.',
          '• Faculty Evaluation: Passed with Distinction. Packet trace logs validated in university lab session.',
        ],
      },
    ],
  });

  // 6. DBMS Model Papers & Solutions
  await generateAcademicPdf({
    fileName: '23CS3106_DBMS_Model_Papers_Solutions.pdf',
    deptText: 'KL UNIVERSITY · DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    courseText: 'Course: 23CS3106 - DATABASE MANAGEMENT SYSTEMS · END-SEM MODEL PAPER',
    title: 'DBMS Model Paper & Comprehensive Solutions Bank',
    page1Sections: [
      {
        heading: 'PART A: NORMALIZATION & FUNCTIONAL DEPENDENCY DECOMPOSITION',
        lines: [
          '• Question: Given relation R(A, B, C, D, E) with F = {A -> BC, CD -> E, B -> D, E -> A}. Find candidate keys and normal form.',
          '• Step 1: Candidate Key Computation:',
          '  - Closure of (A)+ = {A, B, C, D, E} -> A is a Candidate Key.',
          '  - Since E -> A, closure of (E)+ = {E, A, B, C, D} -> E is a Candidate Key.',
          '  - Since CD -> E, closure of (BC)+ = {B, C, D, E, A} -> BC is a Candidate Key.',
          '• Step 2: Normal Form Testing:',
          '  - 1NF: All attributes are atomic. Satisfied.',
          '  - 2NF: No non-prime attribute depends on a proper subset of any candidate key. B -> D violates 2NF because D depends on B (subset of BC).',
          '• Decomposition to BCNF: R1(B, D), R2(A, B, C, E) with lossless join and dependency preservation.',
        ],
      },
      {
        heading: 'PART B: RELATIONAL ALGEBRA & ADVANCED SQL QUERIES',
        lines: [
          '• Schema: Student(sid, sname, cgpa), Enroll(sid, cid, sem), Course(cid, cname, credits).',
          '• Query: Find students with CGPA > 8.5 who enrolled in "DBMS" in "Sem 4":',
          '  - Relational Algebra: PI_{sname} ( sigma_{cgpa > 8.5 and cname = "DBMS" and sem = "Sem 4"} (Student |><| Enroll |><| Course) ).',
        ],
      },
    ],
    page2Header: '23CS3106 DBMS · TRANSACTIONS, CONCURRENCY & INDEXING SOLUTIONS',
    page2Sections: [
      {
        heading: 'PART C: TRANSACTION PROCESSING & CONCURRENCY CONTROL',
        lines: [
          '• ACID Properties Overview:',
          '  - Atomicity (WAL / Undo Log) | Consistency (Integrity Constraints) | Isolation (2PL Locking) | Durability (Redo Log).',
          '• Two-Phase Locking (2PL) Protocol:',
          '  - Growing Phase: Transaction acquires locks; no locks can be released.',
          '  - Shrinking Phase: Transaction releases locks; no new locks can be acquired.',
          '• Conflict Serializability: A schedule S is conflict serializable if its Precedence Graph contains ZERO cycles.',
        ],
      },
      {
        heading: 'PART D: B+ TREE INDEXING & QUERY OPTIMIZATION',
        lines: [
          '• B+ Tree Invariants: All leaves at same level; leaves linked sequentially for O(log N) lookup and O(K) range scan.',
          '• Height of B+ Tree of order p holding N records: Height <= ceil(log_{ceil(p/2)} (N / 2)).',
          '• Clustering Index: Search key specifies sequential order of file records (Only 1 clustered index per table allowed).',
          '• Non-Clustered (Secondary) Index: Pointers to record heap locations (Multiple secondary indexes supported).',
        ],
      },
    ],
  });

  console.log('All authentic academic PDFs built successfully!');
}

buildAllAcademicPdfs().catch(console.error);
