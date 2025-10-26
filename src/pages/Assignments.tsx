import { Layout } from "@/components/Layout";
import { AssignmentCard } from "@/components/AssignmentCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Assignment } from "@/types";

const sampleAssignments: Assignment[] = [
  {
    id: 1,
    name: "Data Structures Final Project",
    description: "Implement a balanced binary search tree",
    due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 100,
    course_id: 101,
    courseName: "CS 201 - Data Structures",
    status: "todo",
  },
  {
    id: 2,
    name: "Machine Learning Assignment 3",
    description: "Neural network implementation",
    due_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 75,
    course_id: 102,
    courseName: "CS 301 - Machine Learning",
    status: "upcoming",
  },
  {
    id: 3,
    name: "Database Design Quiz",
    description: "SQL and normalization",
    due_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 50,
    course_id: 103,
    courseName: "CS 250 - Database Systems",
    status: "overdue",
  },
  {
    id: 4,
    name: "Web Development Portfolio",
    description: "Build a responsive portfolio website",
    due_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 150,
    course_id: 104,
    courseName: "CS 350 - Web Development",
    status: "upcoming",
  },
  {
    id: 5,
    name: "Algorithm Analysis Paper",
    description: "Compare sorting algorithm efficiencies",
    due_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    points_possible: 80,
    course_id: 101,
    courseName: "CS 201 - Data Structures",
    status: "todo",
  },
];

const Assignments = () => {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Assignments</h1>
          <p className="text-muted-foreground">
            View and manage all your course assignments
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Assignments;
