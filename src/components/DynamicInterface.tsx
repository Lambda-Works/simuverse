
import React from 'react';
import { Course } from '../../types';
import CommunicationModule from './modules/CommunicationModule';
import ToolsModule from './modules/ToolsModule';
import DocumentationModule from './modules/DocumentationModule';

interface DynamicInterfaceProps {
  course: Course;
}

const DynamicInterface: React.FC<DynamicInterfaceProps> = ({ course }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
      <p className="mb-4">{course.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {course.modules.includes('communication') && <CommunicationModule />}
        {course.modules.includes('tools') && <ToolsModule />}
        {course.modules.includes('documentation') && <DocumentationModule />}
      </div>
    </div>
  );
};

export default DynamicInterface;
