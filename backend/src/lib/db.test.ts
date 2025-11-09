import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { courseStore } from "./db";
import { buildSampleStudyMap } from "./sampleData";

let tempDir: string;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "studymap-db-"));
  process.env.STUDYMAP_DATA_DIR = tempDir;
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

afterAll(() => {
  delete process.env.STUDYMAP_DATA_DIR;
});

describe("courseStore persistence", () => {
  it("saves courses and lists them later", async () => {
    const studyMap = buildSampleStudyMap({ id: "course-persist" });
    await courseStore.saveCourse(studyMap);

    const snapshot = await courseStore.list();
    expect(Object.keys(snapshot.courses)).toContain(studyMap.course.id);
    expect(snapshot.courseOrder).toContain(studyMap.course.id);
  });

  it("persists microtopic completion toggles", async () => {
    const studyMap = buildSampleStudyMap({ id: "course-progress" });
    await courseStore.saveCourse(studyMap);

    const firstMicro = studyMap.topics[0].subTopics[0].microTopics[0];
    firstMicro.completed = true;

    await courseStore.replaceTopics(studyMap.course.id, studyMap.topics);
    const snapshot = await courseStore.list();
    const persistedMicro =
      snapshot.courses[studyMap.course.id].studyMap.topics[0].subTopics[0].microTopics[0];

    expect(persistedMicro.completed).toBe(true);
  });
});

