export type NodeLevel = "topic" | "subtopic" | "micro";

export type ReorderNodeInput = {
  level: NodeLevel;
  nodeId: string;
  direction: "up" | "down";
  parentTopicId?: string;
  parentSubTopicId?: string;
};

export type AddNodeInput = {
  level: NodeLevel;
  title: string;
  description?: string;
  parentTopicId?: string;
  parentSubTopicId?: string;
};
