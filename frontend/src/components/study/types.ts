import type { MicroTopic, Topic } from "@studymap/types";

export type StudyNode =
  | { type: "topic"; data: Topic }
  | { type: "subtopic"; data: Topic["subTopics"][number] }
  | { type: "micro"; data: MicroTopic };
