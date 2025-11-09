import type { MicroTopic, Topic } from "@studymap/types";

export const flattenMicroTopics = (topics: Topic[]): MicroTopic[] =>
  topics.flatMap((topic) =>
    topic.subTopics.flatMap((sub) => sub.microTopics.map((micro) => micro))
  );

export const topicProgress = (topic: Topic) => {
  const microTopics = topic.subTopics.flatMap((sub) => sub.microTopics);
  const completed = microTopics.filter((micro) => micro.completed).length;
  const total = microTopics.length || 1;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100)
  };
};

export const courseProgress = (topics: Topic[]) => {
  const allMicro = flattenMicroTopics(topics);
  const completed = allMicro.filter((micro) => micro.completed).length;
  const total = allMicro.length || 1;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100)
  };
};
