import { Resource, ProjectItem, UserProfile, Course } from '@/types';
import { KLU_COURSES } from './klu-courses';

export const SAMPLE_COURSES: Course[] = KLU_COURSES.map((c) => ({
  code: c.code,
  name: c.name,
  department: c.department,
  semester: c.semester,
}));

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-student-01',
    username: 'shadow_scholar_01',
    full_name: 'ShadowScholar_01',
    email: 'shadow_scholar_01@vss.campus',
    department: 'CSE',
    semester: 'Sem 4',
    role: 'student',
    student_id: undefined,
    is_verified_student: true,
    code_name: 'SHADOW_SCHOLAR_01',
    academic_position: '👑 Supreme Academic Chancellor',
    bio: 'Passionate about algorithms, competitive programming, and open-source contributions at Virtual Student Space.',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'usr-moderator-01',
    username: 'neural_viper_x',
    full_name: 'NeuralViper_X',
    email: 'neural_viper_x@vss.campus',
    department: 'AI&DS',
    semester: 'Sem 6',
    role: 'moderator',
    student_id: undefined,
    is_verified_student: true,
    code_name: 'NEURAL_VIPER_X',
    academic_position: '🔬 Lead Lab Operations Marshal',
    bio: 'Peer academic mentor & teaching assistant for Machine Learning & DTIE labs.',
    created_at: '2023-09-01T12:00:00Z',
  },
  {
    id: 'usr-admin-01',
    username: 'provost_zero',
    full_name: 'Provost_Zero',
    email: 'provost_zero@vss.campus',
    department: 'CSE / Academic Affairs',
    semester: 'Faculty / Admin',
    role: 'admin',
    student_id: undefined,
    is_verified_student: true,
    code_name: 'PROVOST_ZERO',
    academic_position: 'Chief Academic Marshal & Provost',
    bio: 'VSS system administrator and academic integrity compliance lead.',
    created_at: '2023-07-01T08:00:00Z',
  },
];

export const SAMPLE_RESOURCES: Resource[] = [
  {
    id: 'res-klu-y26-001',
    title: '26UC1137 DTIE Stanford 5-Stage Innovation Portfolio: Campus IoT Heat-Island Mitigator',
    description:
      'Official Y26/Y25 B.Tech Curriculum — Design Thinking for Innovation & Entrepreneurship (26UC1137). Complete Phase 1 to Phase 5 documentation: 50+ campus student empathy interviews, POV statement, SCAMPER ideation, CAD prototyping, and low-cost BOM calculation.',
    category: 'DTIE Projects',
    course_code: '26UC1137',
    course_name: 'Design Thinking for Innovation & Entrepreneurship',
    semester: 'Sem 1',
    academic_year: '2026-2027',
    resource_type: 'DTIE Project Portfolio',
    file_name: '26UC1137_DTIE_Phase1_to_5_Portfolio.pdf',
    file_url: '/samples/26UC1137_DTIE_Phase1_to_5_Portfolio.pdf',
    file_size: 4850000,
    file_type: 'pdf',
    file_content_preview: `KL UNIVERSITY · B.TECH Y26 CURRICULUM
COURSE CODE: 26UC1137 - DESIGN THINKING FOR INNOVATION & ENTREPRENEURSHIP (DTIE)
PROJECT: SMART CAMPUS IOT SHADED MICRO-COOLER & AIR PURIFIER

STAGE 1: EMPATHIZE
- Conducted 50 field interviews across SAC, C-Block, and Girls/Boys Hostels.
- Identified primary pain point: Extreme 44°C ambient radiant heat during peak campus transition hours.

STAGE 2: DEFINE
- POV: "Hostel day-scholars walking across campus require localized evaporative cooling stations to avoid thermal heat exhaustion."

STAGE 3: IDEATE
- SCAMPER matrix created 24 rapid concepts; selected Peltier-assisted solar misting.

STAGE 4: PROTOTYPE
- 3D CAD rendered in Autodesk Fusion 360, acrylic chassis, ESP32 temperature-actuated pump.

STAGE 5: TEST
- Field verified temperature reduction of 6.2°C within a 3-meter zone. Total unit build: ₹3,850 INR.`,
    author_id: 'usr-student-01',
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    is_anonymous: false,
    tags: ['26UC1137', 'DTIE', 'Design Thinking', 'Y26', 'Y25', 'Innovation', 'Prototype'],
    likes_count: 114,
    downloads_count: 730,
    views_count: 2180,
    status: 'approved',
    created_at: '2026-09-18T10:30:00Z',
    updated_at: '2026-09-18T10:30:00Z',
  },
  {
    id: 'res-klu-y26-002',
    title: '26SC1101 Problem Solving Using Programming (Java): Multi-Threaded Banking & ATM Simulator',
    description:
      'Official Y26/Y25 B.Tech Curriculum — Problem Solving Using Programming in Java (26SC1101 / 26SC1101E). Full implementation of OOP concepts, encapsulation, polymorphism, custom banking exceptions, reentrant locking for race condition prevention, and Java collections.',
    category: 'Programming',
    course_code: '26SC1101',
    course_name: 'Problem Solving Using Programming (Java)',
    semester: 'Sem 1',
    academic_year: '2026-2027',
    resource_type: 'Java Source Code',
    file_name: 'BankTransactionEngine.java',
    file_url: '/samples/BankTransactionEngine.java',
    file_size: 19800,
    file_type: 'java',
    file_content_preview: `package in.klu.y26.pspj.banking;

import java.util.concurrent.locks.ReentrantLock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * KL University Y26 Curriculum - 26SC1101 Problem Solving Using Programming (Java)
 * Thread-Safe High-Throughput Campus Wallet Engine.
 */
public class BankTransactionEngine {
    private final Map<String, Account> accounts = new ConcurrentHashMap<>();
    private final ReentrantLock transferLock = new ReentrantLock();

    public static class Account {
        private final String accountId;
        private double balance;

        public Account(String accountId, double initialBalance) {
            this.accountId = accountId;
            this.balance = initialBalance;
        }

        public synchronized void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
            this.balance += amount;
        }

        public synchronized boolean withdraw(double amount) {
            if (amount > balance) return false;
            this.balance -= amount;
            return true;
        }

        public synchronized double getBalance() { return balance; }
        public String getAccountId() { return accountId; }
    }

    public boolean transferFunds(String fromId, String toId, double amount) {
        transferLock.lock();
        try {
            Account from = accounts.get(fromId);
            Account to = accounts.get(toId);
            if (from == null || to == null) return false;
            if (from.withdraw(amount)) {
                to.deposit(amount);
                return true;
            }
            return false;
        } finally {
            transferLock.unlock();
        }
    }
}`,
    author_id: 'usr-student-01',
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    is_anonymous: false,
    tags: ['26SC1101', 'Java', 'PSPJ', 'Y26', 'Y25', 'OOP', 'Multi-Threading'],
    likes_count: 88,
    downloads_count: 560,
    views_count: 1450,
    status: 'approved',
    created_at: '2026-10-02T14:15:00Z',
    updated_at: '2026-10-02T14:15:00Z',
  },
  {
    id: 'res-klu-y26-003',
    title: '26AD2202 Generative AI: Campus Knowledge Retrieval-Augmented Generation (RAG) Architecture',
    description:
      'Official Y26/Y25 B.Tech Curriculum — Generative AI & AI Platform Engineering (26AD2202). Complete pipeline with LangChain, FAISS vector index, Gemini Embeddings, and local inference server for academic question answering.',
    category: 'Programming',
    course_code: '26AD2202',
    course_name: 'Generative AI & AI Platform Engineering',
    semester: 'Sem 4',
    academic_year: '2026-2027',
    resource_type: 'Python Pipeline',
    file_name: 'campus_rag_pipeline.py',
    file_url: '/samples/campus_rag_pipeline.py',
    file_size: 24200,
    file_type: 'py',
    file_content_preview: `"""
KL University Y26 Curriculum · 26AD2202 Generative AI & AI Platform Engineering
Modular Vector Retrieval Pipeline for Academic Notes & Lab Manuals
"""
import os
from typing import List

class DocumentChunk:
    def __init__(self, doc_id: str, content: str, course_code: str):
        self.doc_id = doc_id
        self.content = content
        self.course_code = course_code

class AcademicRAGIndex:
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        self.chunks: List[DocumentChunk] = []

    def index_syllabus_unit(self, unit_title: str, text: str, course_code: str):
        chunk = DocumentChunk(doc_id=unit_title, content=text, course_code=course_code)
        self.chunks.append(chunk)
        print(f"[RAG] Indexed chunk for {course_code}: {unit_title}")

    def query(self, prompt: str, top_k: int = 3):
        # Cosine similarity matching over semantic vectors
        return self.chunks[:top_k]

if __name__ == "__main__":
    rag = AcademicRAGIndex()
    rag.index_syllabus_unit("Unit 1: LLM Prompt Tuning", "In-context few-shot learning...", "26AD2202")
    results = rag.query("How to tune prompts?")
    print(f"Retrieved {len(results)} context documents.")`,
    author_id: 'usr-moderator-01',
    author_name: 'NeuralViper_X',
    author_username: 'neural_viper_x',
    is_anonymous: false,
    tags: ['26AD2202', 'GenAI', 'AI&DS', 'Y26', 'Y25', 'RAG', 'Python', 'LLM'],
    likes_count: 142,
    downloads_count: 910,
    views_count: 2840,
    status: 'approved',
    created_at: '2026-10-15T09:40:00Z',
    updated_at: '2026-10-15T09:40:00Z',
  },
  {
    id: 'res-klu-001',
    title: 'Binary Search Trees & AVL Tree Rotations Lab Record with Observations',
    description:
      'Complete lab record documentation for 23CS2101 Lab Experiment 5. Contains full C/Java source code for Left-Left, Right-Right, Left-Right, and Right-Left AVL rotations, time complexity analysis, test outputs, and diagrammatic tree balancing steps.',
    category: 'Lab Records',
    course_code: '23CS2101',
    course_name: 'Data Structures & Algorithms',
    semester: 'Sem 3',
    academic_year: '2024-2025',
    resource_type: 'Lab Record',
    file_name: '23CS2101_Exp5_AVL_Trees_LabRecord.pdf',
    file_url: '/samples/23CS2101_Exp5_AVL_Trees_LabRecord.pdf',
    file_size: 2450000, // ~2.4MB
    file_type: 'pdf',
    file_content_preview: `EXPERIMENT NO: 05
COURSE CODE: 23CS2101 - DATA STRUCTURES AND ALGORITHMS
TITLE: IMPLEMENTATION OF SELF-BALANCING BINARY SEARCH TREES (AVL TREES)

OBJECTIVE:
To design, implement, and analyze AVL Tree insertion, deletion, and rotation operations to maintain O(log n) height invariant.

ALGORITHM OVERVIEW:
1. Standard BST insertion based on key comparison.
2. Update the height of ancestor nodes recursively.
3. Calculate Balance Factor: BF = height(left_subtree) - height(right_subtree).
4. Apply Rotations:
   - Case 1 (Left Left): RightRotate(z)
   - Case 2 (Right Right): LeftRotate(z)
   - Case 3 (Left Right): LeftRotate(y) then RightRotate(z)
   - Case 4 (Right Left): RightRotate(y) then LeftRotate(z)

VERIFIED LAB TEST CASES:
Input Sequence: 10, 20, 30, 40, 50, 25
Output In-Order Traversal: 10 20 25 30 40 50
Resulting Root: 30, Height: 3 (Balanced)`,
    author_id: 'usr-student-01',
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    is_anonymous: false,
    tags: ['AVL Trees', 'Data Structures', '23CS2101', 'Trees', 'C++', 'Lab Record'],
    likes_count: 48,
    downloads_count: 312,
    views_count: 890,
    status: 'approved',
    created_at: '2024-09-12T14:20:00Z',
    updated_at: '2024-09-12T14:20:00Z',
  },
  {
    id: 'res-klu-002',
    title: 'DTIE Project Report: Smart Campus Solar-Powered Air Purifier & Heat Island Mitigator',
    description:
      'Design Thinking & Innovation in Engineering (DTIE) Phase 1 to Phase 5 comprehensive report. Includes Empathy Mapping with campus security staff and students, Problem Definition statement, Ideation SCAMPER method, Low-fidelity cardboard prototype sketches, CAD renderings, and Bill of Materials costing under ₹4,500.',
    category: 'DTIE Projects',
    course_code: '23DT1101',
    course_name: 'Design Thinking & Innovation in Engineering (DTIE)',
    semester: 'Sem 2',
    academic_year: '2023-2024',
    resource_type: 'DTIE Project Report',
    file_name: 'DTIE_Smart_Campus_Cooler_Report.pdf',
    file_url: '/samples/DTIE_Smart_Campus_Cooler_Report.pdf',
    file_size: 5820000,
    file_type: 'pdf',
    file_content_preview: `KL UNIVERSITY — DEPARTMENT OF GENERAL ENGINEERING
COURSE: 23DT1101 DESIGN THINKING & INNOVATION IN ENGINEERING (DTIE)
PROJECT TITLE: ZERO-EMISSION SOLAR CAMPUS HEAT MITIGATOR & AIR PURIFIER

EXECUTIVE SUMMARY:
During peak summer in Vijayawada/Guntur regions, campus walkways experience ambient temperatures surpassing 43°C with heavy particulate dust. This project follows the Stanford d.school 5-stage Design Thinking methodology:

PHASE 1: EMPATHIZE
- 42 field interviews conducted with campus day-scholars, bus drivers, and outdoor groundskeepers.
- Empathy Map reveals: Extreme dehydration, fatigue when walking between SAC and CS Blocks.

PHASE 2: DEFINE (POV Statement)
"Outdoor campus pedestrians need accessible, shaded micro-cooling spots because long walking distances under direct sunlight lead to physical heat exhaustion."

PHASE 3: IDEATE
- SCAMPER brainstorming session yielded 30 concepts; down-selected using Pugh matrix.

PHASE 4: PROTOTYPE
- 12V DC evaporative mist cooler paired with high-efficiency cellulose pads and solar trickle charging.
- Estimated total unit cost: ₹4,250 INR.`,
    author_id: 'usr-moderator-01',
    author_name: 'NeuralViper_X',
    author_username: 'neural_viper_x',
    is_anonymous: false,
    tags: ['DTIE', 'Design Thinking', '23DT1101', 'Prototype', 'Innovation', 'Report'],
    likes_count: 92,
    downloads_count: 540,
    views_count: 1420,
    status: 'approved',
    created_at: '2024-04-18T09:15:00Z',
    updated_at: '2024-04-18T09:15:00Z',
  },
  {
    id: 'res-klu-003',
    title: 'Spring Boot RESTful API Assignment 2: Student Campus Event Registration System',
    description:
      'Complete assignment submission for 23CS2202 Advanced Java OOP. Implements Spring Boot 3.2 backend, Spring Data JPA with PostgreSQL, Hibernate validation, JWT authentication, and Swagger OpenAPI documentation. Includes full Postman collection JSON and unit tests with JUnit 5.',
    category: 'Assignments',
    course_code: '23CS2202',
    course_name: 'Advanced Object Oriented Programming (Java)',
    semester: 'Sem 3',
    academic_year: '2024-2025',
    resource_type: 'Assignment Code',
    file_name: 'EventRegistrationController.java',
    file_url: '/samples/EventRegistrationController.java',
    file_size: 14500,
    file_type: 'java',
    file_content_preview: `package in.kluniversity.events.controller;

import in.kluniversity.events.dto.EventRequest;
import in.kluniversity.events.dto.EventResponse;
import in.kluniversity.events.service.EventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@CrossOrigin(origins = "*")
public class EventRegistrationController {

    private final EventService eventService;

    public EventRegistrationController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping("/register")
    public ResponseEntity<EventResponse> registerForEvent(@Valid @RequestBody EventRequest request) {
        EventResponse response = eventService.registerStudent(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EventResponse>> getActiveCampusEvents() {
        return ResponseEntity.ok(eventService.findAllActiveEvents());
    }

    @DeleteMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelRegistration(@PathVariable Long id) {
        eventService.cancelRegistration(id);
        return ResponseEntity.noContent().build();
    }
}`,
    author_id: 'usr-student-01',
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    is_anonymous: false,
    tags: ['Java', 'Spring Boot', '23CS2202', 'REST API', 'Assignment', 'JPA'],
    likes_count: 67,
    downloads_count: 410,
    views_count: 1100,
    status: 'approved',
    created_at: '2024-10-05T16:45:00Z',
    updated_at: '2024-10-05T16:45:00Z',
  },
  {
    id: 'res-klu-004',
    title: 'Discrete Mathematics Unit 2 & 3 Handwritten Revision Notes with Solved PYQs',
    description:
      'Clear, neatly structured handwritten summary notes for 23MT2001. Covers Propositional Logic, Predicate Calculus, Generating Functions, Pigeonhole Principle, Recurrence Relations (Homogeneous & Non-Homogeneous), and Graph Theory (Euler & Hamiltonian paths). Includes 15 past end-sem exam questions solved step by step.',
    category: 'Notes',
    course_code: '23MT2001',
    course_name: 'Discrete Mathematics & Graph Theory',
    semester: 'Sem 3',
    academic_year: '2024-2025',
    resource_type: 'Lecture Notes',
    file_name: '23MT2001_Discrete_Maths_Unit2_Unit3_Notes.pdf',
    file_url: '/samples/23MT2001_Discrete_Maths_Unit2_Unit3_Notes.pdf',
    file_size: 4200000,
    file_type: 'pdf',
    file_content_preview: `DISCRETE MATHEMATICS & GRAPH THEORY (23MT2001)
UNIT 2: COMBINATORICS & RECURRENCE RELATIONS

1. PIGEONHOLE PRINCIPLE (PHP):
If n pigeons are put into k pigeonholes with n > k, then at least one pigeonhole must contain more than one pigeon.
Generalized PHP: At least one hole contains >= ceil(n / k) pigeons.

Example (From 2023 End-Sem Exam):
Show that among any group of 5 integers, there are two with the same remainder when divided by 4.
Proof:
Remainders possible when divided by 4: {0, 1, 2, 3} -> k = 4 holes.
Number of integers selected: n = 5 pigeons.
Since 5 > 4, by PHP, at least two integers yield the exact same remainder. Q.E.D.

2. SOLVING LINEAR RECURRENCE RELATIONS:
Given: a_n - 7a_{n-1} + 12a_{n-2} = 0, with a_0 = 1, a_1 = 8
Characteristic Equation: r^2 - 7r + 12 = 0 => (r - 3)(r - 4) = 0
Roots: r_1 = 3, r_2 = 4
General Solution: a_n = C_1*(3)^n + C_2*(4)^n
Using Initial Conditions:
a_0 = C_1 + C_2 = 1
a_1 = 3C_1 + 4C_2 = 8
Solving gives: C_1 = -4, C_2 = 5
Particular Solution: a_n = -4*(3)^n + 5*(4)^n`,
    author_id: 'usr-student-01',
    author_name: 'Anonymous Student',
    author_username: 'anonymous',
    is_anonymous: true,
    tags: ['Discrete Mathematics', '23MT2001', 'Maths', 'Notes', 'PYQs', 'Graphs'],
    likes_count: 145,
    downloads_count: 890,
    views_count: 2310,
    status: 'approved',
    created_at: '2024-10-20T11:00:00Z',
    updated_at: '2024-10-20T11:00:00Z',
  },
  {
    id: 'res-klu-005',
    title: 'Wireshark Network Packet Analysis Lab 4: TCP 3-Way Handshake & HTTP/DNS Flows',
    description:
      'Detailed packet capture screenshots, filter commands, sequence diagrams, and port analysis for 23CS3309 Computer Networks. Captures SYN, SYN-ACK, ACK sequence numbers, FIN teardown, and DNS UDP transaction analysis.',
    category: 'Lab Experiments',
    course_code: '23CS3309',
    course_name: 'Computer Networks & Protocols',
    semester: 'Sem 5',
    academic_year: '2024-2025',
    resource_type: 'Lab Experiment',
    file_name: '23CS3309_Wireshark_TCP_Handshake_Analysis.pdf',
    file_url: '/samples/23CS3309_Wireshark_TCP_Handshake_Analysis.pdf',
    file_size: 3100000,
    file_type: 'pdf',
    file_content_preview: `EXPERIMENT 4: TCP THREE-WAY HANDSHAKE & PACKET TRACE DECODING
COURSE: 23CS3309 COMPUTER NETWORKS & PROTOCOLS

WIRESHARK CAPTURE FILTER:
ip.addr == 172.16.12.44 && (tcp.port == 80 || tcp.port == 443)

PACKET BREAKDOWN:
Frame 12 (Client -> Server):
  Source Port: 54321, Dest Port: 443
  Flags: 0x002 [SYN]
  Sequence Number: 0 (Relative) / 2847192841 (Raw)
  Window Size: 65535, MSS: 1460

Frame 13 (Server -> Client):
  Source Port: 443, Dest Port: 54321
  Flags: 0x012 [SYN, ACK]
  Sequence Number: 0, Acknowledgment Number: 1

Frame 14 (Client -> Server):
  Source Port: 54321, Dest Port: 443
  Flags: 0x010 [ACK]
  Sequence Number: 1, Acknowledgment Number: 1
  Status: TCP CONNECTION ESTABLISHED IN 18.4ms RTT.`,
    author_id: 'usr-moderator-01',
    author_name: 'NeuralViper_X',
    author_username: 'neural_viper_x',
    is_anonymous: false,
    tags: ['Computer Networks', '23CS3309', 'Wireshark', 'TCP/IP', 'Lab Experiment'],
    likes_count: 53,
    downloads_count: 360,
    views_count: 940,
    status: 'approved',
    created_at: '2024-10-28T08:30:00Z',
    updated_at: '2024-10-28T08:30:00Z',
  },
  {
    id: 'res-klu-006',
    title: 'Tomato Leaf Disease Detection with PyTorch CNN & MobileNetV3 Transfer Learning',
    description:
      'Python Jupyter Notebook & complete pipeline code for 23AI2102 Applied Machine Learning. Achieves 96.8% test accuracy across 10 disease classes on the PlantVillage dataset. Includes data augmentation, ROC-AUC curves, confusion matrix generation, and ONNX model export for edge devices.',
    category: 'Programming',
    course_code: '23AI2102',
    course_name: 'Applied Machine Learning Foundations',
    semester: 'Sem 5',
    academic_year: '2024-2025',
    resource_type: 'Source Code / Notebook',
    file_name: 'plant_leaf_disease_cnn.py',
    file_url: '/samples/plant_leaf_disease_cnn.py',
    file_size: 28400,
    file_type: 'py',
    file_content_preview: `import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import DataLoader

class LeafDiseaseClassifier(nn.Module):
    """
    KLU 23AI2102 Coursework: MobileNetV3-based classifier for crop foliage health.
    """
    def __init__(self, num_classes=10, pretrained=True):
        super(LeafDiseaseClassifier, self).__init__()
        weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        self.backbone = models.mobilenet_v3_small(weights=weights)
        
        # Replace classification head
        in_features = self.backbone.classifier[3].in_features
        self.backbone.classifier[3] = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes)
        )
        
    def forward(self, x):
        return self.backbone(x)

if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = LeafDiseaseClassifier(num_classes=10).to(device)
    print(f"Model instantiated successfully on: {device}")`,
    author_id: 'usr-student-01',
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    is_anonymous: false,
    tags: ['Machine Learning', 'PyTorch', '23AI2102', 'Python', 'Computer Vision'],
    likes_count: 81,
    downloads_count: 512,
    views_count: 1350,
    status: 'approved',
    created_at: '2024-11-04T12:00:00Z',
    updated_at: '2024-11-04T12:00:00Z',
  },
  {
    id: 'res-klu-007',
    title: '4-Bit Arithmetic Logic Unit (ALU) Verilog HDL Code, Testbench & Waveforms',
    description:
      'Complete lab code and simulation waveforms for 23EC2203 Digital Logic & Computer Architecture. Implements 8 arithmetic and logic operations (ADD, SUB, AND, OR, XOR, NOT, Shift Left, Shift Right) with zero flag, carry out, and overflow status flags.',
    category: 'Programming',
    course_code: '23EC2203',
    course_name: 'Digital Logic & Computer Architecture',
    semester: 'Sem 3',
    academic_year: '2024-2025',
    resource_type: 'HDL Code',
    file_name: 'alu_4bit.v',
    file_url: '/samples/alu_4bit.v',
    file_size: 8900,
    file_type: 'c',
    file_content_preview: `module alu_4bit (
    input [3:0] A,
    input [3:0] B,
    input [2:0] Opcode,
    output reg [3:0] Result,
    output reg CarryOut,
    output ZeroFlag
);
    assign ZeroFlag = (Result == 4'b0000);

    always @(*) begin
        CarryOut = 1'b0;
        case (Opcode)
            3'b000: {CarryOut, Result} = A + B;       // Addition
            3'b001: {CarryOut, Result} = A - B;       // Subtraction
            3'b010: Result = A & B;                   // Bitwise AND
            3'b011: Result = A | B;                   // Bitwise OR
            3'b100: Result = A ^ B;                   // Bitwise XOR
            3'b101: Result = ~A;                      // Bitwise NOT A
            3'b110: Result = A << 1;                  // Shift Left
            3'b111: Result = A >> 1;                  // Shift Right
            default: Result = 4'b0000;
        endcase
    end
endmodule`,
    author_id: 'usr-student-01',
    author_name: 'KLU Hardware Enthusiast',
    author_username: 'hardware_klu',
    is_anonymous: false,
    tags: ['Verilog', 'ALU', '23EC2203', 'ECE', 'Digital Logic'],
    likes_count: 39,
    downloads_count: 220,
    views_count: 670,
    status: 'approved',
    created_at: '2024-11-10T17:10:00Z',
    updated_at: '2024-11-10T17:10:00Z',
  },
  {
    id: 'res-klu-008',
    title: 'Comprehensive End-Sem Question Bank & Model Solutions: Database Management Systems',
    description:
      'Curated repository of past 4 years examination questions for 23CS3106 DBMS. Detailed step-by-step solutions for B+ Tree insertion/deletion, Boyce-Codd Normal Form (BCNF) decomposition proofs, ACID transaction schedules with serializability graphs, and complex nested SQL queries.',
    category: 'Study Resources',
    course_code: '23CS3106',
    course_name: 'Database Management Systems',
    semester: 'Sem 4',
    academic_year: '2023-2024',
    resource_type: 'Question Bank',
    file_name: '23CS3106_DBMS_Model_Papers_Solutions.pdf',
    file_url: '/samples/23CS3106_DBMS_Model_Papers_Solutions.pdf',
    file_size: 4700000,
    file_type: 'pdf',
    file_content_preview: `KL UNIVERSITY — DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
COURSE CODE: 23CS3106 DATABASE MANAGEMENT SYSTEMS
COMPREHENSIVE QUESTION BANK & MODEL ANSWERS

TOPIC: NORMALIZATION TO BCNF
Question:
Given relation R(A, B, C, D, E) with Functional Dependencies:
FD1: A -> BCD
FD2: BC -> DE
FD3: B -> D
FD4: D -> A

Task: Determine the candidate keys and decompose R into BCNF.

Solution:
1. Candidate Key Computation:
   Attribute closure of A: A+ = {A, B, C, D, E} -> A is a candidate key.
   Attribute closure of BC: (BC)+ = {A, B, C, D, E} -> BC is a candidate key.
   Attribute closure of D: (D)+ = {A, B, C, D, E} -> D is a candidate key.

2. Check BCNF condition (X -> Y holds only if X is a superkey):
   - FD3 (B -> D): B is NOT a superkey. Violates BCNF!
3. Decomposition:
   Decompose R into:
   R1 = (B, D) with key B.
   R2 = (A, B, C, E) with key A.
   Both relations now satisfy BCNF.`,
    author_id: 'usr-admin-01',
    author_name: 'Academic Affairs Peer Lead',
    author_username: 'academic_lead',
    is_anonymous: false,
    tags: ['DBMS', '23CS3106', 'SQL', 'Normalization', 'Question Bank', 'Study Material'],
    likes_count: 172,
    downloads_count: 1250,
    views_count: 3400,
    status: 'approved',
    created_at: '2024-11-14T09:00:00Z',
    updated_at: '2024-11-14T09:00:00Z',
  },
];

export const SAMPLE_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-klu-001',
    title: 'Autonomous Drone-based Campus Perimeter Surveillance & Geo-mapping System',
    description:
      'Major Capstone engineering initiative leveraging computer vision, YOLOv8 object detection, and GPS telemetry streaming to monitor campus boundary perimeter zones, detect anomalous activity at night, and generate 3D orthomosaic maps.',
    category: 'Major Project',
    tech_stack: ['Python', 'YOLOv8', 'ROS2', 'OpenCV', 'React', 'FastAPI', 'Gazebo'],
    github_url: 'https://github.com/demo-klu-team/campus-aerial-surveillance',
    live_url: 'https://demo-drone-surveillance.klu-commons.internal',
    demo_video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    course_code: '23CS4201',
    course_name: 'Major Project / Capstone',
    semester: 'Sem 8',
    academic_year: '2024-2025',
    team_members: ['ShadowScholar_01 (Lead)', 'CyberFalcon_99', 'QuantumEcho_23', 'BinaryGhost_12'],
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    likes_count: 128,
    created_at: '2024-10-01T10:00:00Z',
  },
  {
    id: 'proj-klu-002',
    title: 'Smart Hostel Mess Food Waste Monitoring & Nutrition Optimization Portal',
    description:
      'DTIE & Mini Project combination deployed with load cells and ESP32 IoT controllers. Tracks daily mess food preparation vs plate waste metrics, forecasts student attendance based on timetable feeds, and produces weekly wastage analytics.',
    category: 'DTIE Project',
    tech_stack: ['Next.js', 'ESP32 C++', 'MQTT', 'TailwindCSS', 'PostgreSQL', 'Chart.js'],
    github_url: 'https://github.com/demo-klu-team/mess-waste-optimizer',
    live_url: 'https://mess-optimizer.klu-commons.internal',
    course_code: '23DT1101',
    course_name: 'Design Thinking & Innovation in Engineering',
    semester: 'Sem 3',
    academic_year: '2024-2025',
    team_members: ['NeuralViper_X (Lead)', 'AlgoPhantom_42', 'CircuitTitan_77'],
    author_name: 'NeuralViper_X',
    author_username: 'neural_viper_x',
    likes_count: 89,
    created_at: '2024-10-15T14:30:00Z',
  },
  {
    id: 'proj-klu-003',
    title: 'CodeSphere: Real-time Collaborative Code Interview & Pair Programming Sandbox',
    description:
      'Hackathon award-winning software engineering project built for student mock technical interviews. Supports WebSockets code synchronization, Monaco editor, in-browser Docker sandboxed compilation, and WebRTC video chat.',
    category: 'Hackathon Project',
    tech_stack: ['React', 'TypeScript', 'Node.js', 'Docker', 'WebRTC', 'Redis', 'Socket.io'],
    github_url: 'https://github.com/demo-klu-team/codesphere-interview-prep',
    live_url: 'https://codesphere.klu-commons.internal',
    course_code: '23CS3105',
    course_name: 'Software Engineering & Hackathons',
    semester: 'Sem 5',
    academic_year: '2024-2025',
    team_members: ['ShadowScholar_01 (Lead)', 'DataValkyrie_09'],
    author_name: 'ShadowScholar_01',
    author_username: 'shadow_scholar_01',
    likes_count: 142,
    created_at: '2024-11-02T18:00:00Z',
  },
  {
    id: 'proj-klu-004',
    title: 'Edge AI Wearable for Real-time Drowsiness Detection in Campus Bus Fleets',
    description:
      'Hardware and AI project using Raspberry Pi 4, IR camera sensor, and OpenCV facial landmark tracking (Eye Aspect Ratio and Mouth Aspect Ratio) to trigger auditory buzzer alerts if driver microsleep is detected.',
    category: 'Hardware Project',
    tech_stack: ['Raspberry Pi', 'Python', 'OpenCV', 'dlib', 'TensorFlow Lite', 'Hardware I2C'],
    github_url: 'https://github.com/demo-klu-team/bus-safety-edge-ai',
    course_code: '23EC2203',
    course_name: 'Hardware Mini Project',
    semester: 'Sem 4',
    academic_year: '2023-2024',
    team_members: ['AlgoPhantom_42 (Lead)', 'NeonSpectre_64', 'NovaPilot_11'],
    author_name: 'AlgoPhantom_42',
    author_username: 'algo_phantom_42',
    likes_count: 64,
    created_at: '2024-08-20T11:20:00Z',
  },
];
