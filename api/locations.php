
<?php

require_once "db.php";

header("Content-Type: application/json; charset=UTF-8");

// ส่งข้อมูลกลับเป็น JSON
function response($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER["REQUEST_METHOD"];

// =========================
// GET: ดึงตำแหน่งทั้งหมด
// =========================

if ($method === "GET") {

    $sql = "SELECT
                id,
                name,
                type,
                parent_id AS parentId,
                created_at AS createdAt
            FROM locations
            ORDER BY created_at ASC";

    $stmt = $pdo->query($sql);

    response($stmt->fetchAll(PDO::FETCH_ASSOC));
}

// =========================
// POST: เพิ่มตำแหน่งใหม่
// =========================

if ($method === "POST") {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        response(["error" => "Invalid JSON"], 400);
    }

    $name = trim($data["name"] ?? "");
    $type = $data["type"] ?? "";
    $parentId = $data["parentId"] ?? null;

    if ($name === "") {
        response(["error" => "กรุณากรอกชื่อตำแหน่ง"], 400);
    }

    $allowedParents = [
        "house" => [],
        "room" => ["house"],
        "cabinet" => ["room"],
        "shelf" => ["cabinet"],
        "box" => ["shelf"]
    ];

    if (!array_key_exists($type, $allowedParents)) {
        response(["error" => "ประเภทตำแหน่งไม่ถูกต้อง"], 400);
    }

    // ตรวจสอบตำแหน่งแม่
    if ($type === "house") {

        if ($parentId !== null && $parentId !== "") {
            response(["error" => "บ้านต้องเป็นตำแหน่งระดับบนสุด"], 400);
        }

        $parentId = null;
    } else {

        if (!$parentId) {
            response(["error" => "กรุณาเลือกตำแหน่งแม่"], 400);
        }

        $stmt = $pdo->prepare(
            "SELECT type FROM locations WHERE id = ?"
        );

        $stmt->execute([$parentId]);

        $parent = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$parent ||
            !in_array($parent["type"], $allowedParents[$type], true)
        ) {
            response(["error" => "ตำแหน่งแม่ไม่ถูกต้อง"], 400);
        }
    }

    // ตรวจสอบชื่อซ้ำในตำแหน่งแม่เดียวกัน
    $stmt = $pdo->prepare(
        "SELECT id FROM locations
         WHERE name = ?
         AND type = ?
         AND parent_id <=> ?"
    );

    $stmt->execute([$name, $type, $parentId]);

    if ($stmt->fetch()) {
        response(["error" => "มีตำแหน่งชื่อนี้อยู่แล้ว"], 409);
    }

    // สร้าง ID
    $id = "LOC-" . bin2hex(random_bytes(16));

    // บันทึกลง MySQL
    $stmt = $pdo->prepare(
        "INSERT INTO locations (id, name, type, parent_id)
         VALUES (?, ?, ?, ?)"
    );

    $stmt->execute([
        $id,
        $name,
        $type,
        $parentId
    ]);

    response([
        "message" => "เพิ่มตำแหน่งสำเร็จ",
        "location" => [
            "id" => $id,
            "name" => $name,
            "type" => $type,
            "parentId" => $parentId,
            "createdAt" => date("Y-m-d H:i:s")
        ]
    ], 201);
}

// =========================
// PUT: แก้ไขตำแหน่ง
// =========================

if ($method === "PUT") {

    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        response(["error" => "Invalid JSON"], 400);
    }

    $id = $data["id"] ?? "";
    $name = trim($data["name"] ?? "");
    $type = $data["type"] ?? "";
    $parentId = $data["parentId"] ?? null;

    if ($id === "" || $name === "") {
        response(["error" => "กรุณาระบุ ID และชื่อ"], 400);
    }

    $allowedParents = [
        "house" => [],
        "room" => ["house"],
        "cabinet" => ["room"],
        "shelf" => ["cabinet"],
        "box" => ["shelf"]
    ];

    if (!array_key_exists($type, $allowedParents)) {
        response(["error" => "ประเภทตำแหน่งไม่ถูกต้อง"], 400);
    }

    // ตรวจสอบว่าตำแหน่งที่จะแก้ไขมีอยู่จริง
    $stmt = $pdo->prepare(
        "SELECT id FROM locations WHERE id = ?"
    );
    $stmt->execute([$id]);

    if (!$stmt->fetch()) {
        response(["error" => "ไม่พบตำแหน่งนี้"], 404);
    }

    // ตรวจสอบตำแหน่งแม่
    if ($type === "house") {

        if ($parentId !== null && $parentId !== "") {
            response(["error" => "บ้านต้องเป็นตำแหน่งระดับบนสุด"], 400);
        }

        $parentId = null;
    } else {

        if (!$parentId || $parentId === $id) {
            response(["error" => "กรุณาเลือกตำแหน่งแม่ที่ถูกต้อง"], 400);
        }

        $stmt = $pdo->prepare(
            "SELECT type FROM locations WHERE id = ?"
        );
        $stmt->execute([$parentId]);

        $parent = $stmt->fetch(PDO::FETCH_ASSOC);

        if (
            !$parent ||
            !in_array($parent["type"], $allowedParents[$type], true)
        ) {
            response(["error" => "ตำแหน่งแม่ไม่ถูกต้อง"], 400);
        }
    }

    // ตรวจสอบชื่อซ้ำ
    $stmt = $pdo->prepare(
        "SELECT id FROM locations
         WHERE name = ?
         AND type = ?
         AND parent_id <=> ?
         AND id != ?"
    );

    $stmt->execute([$name, $type, $parentId, $id]);

    if ($stmt->fetch()) {
        response(["error" => "มีตำแหน่งชื่อนี้อยู่แล้ว"], 409);
    }

    // อัปเดตข้อมูล
    $stmt = $pdo->prepare(
        "UPDATE locations
         SET name = ?, type = ?, parent_id = ?
         WHERE id = ?"
    );

    $stmt->execute([$name, $type, $parentId, $id]);

    response([
        "message" => "แก้ไขตำแหน่งสำเร็จ"
    ]);
}

// =========================
// DELETE: ลบตำแหน่ง
// =========================

if ($method === "DELETE") {

    $id = $_GET["id"] ?? "";

    if ($id === "") {
        response(["error" => "กรุณาระบุ ID"], 400);
    }

    // ตรวจสอบว่ามีตำแหน่งนี้หรือไม่
    $stmt = $pdo->prepare(
        "SELECT id FROM locations WHERE id = ?"
    );

    $stmt->execute([$id]);

    if (!$stmt->fetch()) {
        response(["error" => "ไม่พบตำแหน่งนี้"], 404);
    }

    // ตรวจสอบว่ามีตำแหน่งลูกหรือไม่
    $stmt = $pdo->prepare(
        "SELECT id FROM locations WHERE parent_id = ?"
    );

    $stmt->execute([$id]);

    if ($stmt->fetch()) {
        response([
            "error" => "ไม่สามารถลบได้ เพราะยังมีตำแหน่งลูกอยู่"
        ], 409);
    }
    // ตรวจสอบว่ามีสิ่งของอยู่ในตำแหน่งนี้หรือไม่
    $stmt = $pdo->prepare(
        "SELECT id FROM item_locations WHERE location_id = ?"
    );

    $stmt->execute([$id]);

    if ($stmt->fetch()) {
        response([
            "error" => "ไม่สามารถลบได้ เพราะยังมีสิ่งของอยู่ในตำแหน่งนี้"
        ], 409);
    }
    // ลบตำแหน่ง
    $stmt = $pdo->prepare(
        "DELETE FROM locations WHERE id = ?"
    );

    $stmt->execute([$id]);

    response([
        "message" => "ลบตำแหน่งสำเร็จ",
        "deletedId" => $id
    ]);
}

// =========================
// Method ที่ยังไม่รองรับ
// =========================

response(["error" => "Method not allowed"], 405);
