import { render, screen } from '@testing-library/react';
import { Skeleton, TextSkeleton, AvatarSkeleton, CardSkeleton } from '../ui/LoadingSkeleton';

describe('LoadingSkeleton Components', () => {
    describe('Skeleton', () => {
        it('renders with default classes', () => {
            const { container } = render(<Skeleton />);
            const skeleton = container.firstChild as HTMLElement;
            expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded');
        });

        it('accepts custom className', () => {
            const { container } = render(<Skeleton className="h-4 w-full" />);
            const skeleton = container.firstChild as HTMLElement;
            expect(skeleton).toHaveClass('h-4', 'w-full');
        });
    });

    describe('TextSkeleton', () => {
        it('renders correct number of lines', () => {
            const { container } = render(<TextSkeleton lines={4} />);
            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons).toHaveLength(4);
        });

        it('renders 3 lines by default', () => {
            const { container } = render(<TextSkeleton />);
            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons).toHaveLength(3);
        });

        it('last line is shorter', () => {
            const { container } = render(<TextSkeleton lines={2} />);
            const skeletons = container.querySelectorAll('.animate-pulse');
            expect(skeletons[1]).toHaveClass('w-3/4');
        });
    });

    describe('AvatarSkeleton', () => {
        it('renders small size correctly', () => {
            const { container } = render(<AvatarSkeleton size="sm" />);
            const skeleton = container.firstChild as HTMLElement;
            expect(skeleton).toHaveClass('w-8', 'h-8', 'rounded-full');
        });

        it('renders medium size by default', () => {
            const { container } = render(<AvatarSkeleton />);
            const skeleton = container.firstChild as HTMLElement;
            expect(skeleton).toHaveClass('w-12', 'h-12');
        });

        it('renders large size correctly', () => {
            const { container } = render(<AvatarSkeleton size="lg" />);
            const skeleton = container.firstChild as HTMLElement;
            expect(skeleton).toHaveClass('w-16', 'h-16');
        });
    });

    describe('CardSkeleton', () => {
        it('renders with image by default', () => {
            const { container } = render(<CardSkeleton />);
            const imageSkeleton = container.querySelector('.h-48');
            expect(imageSkeleton).toBeInTheDocument();
        });

        it('can render without image', () => {
            const { container } = render(<CardSkeleton hasImage={false} />);
            const imageSkeleton = container.querySelector('.h-48');
            expect(imageSkeleton).not.toBeInTheDocument();
        });

        it('has content area with text and avatar skeletons', () => {
            const { container } = render(<CardSkeleton />);
            const contentArea = container.querySelector('.p-4');
            expect(contentArea).toBeInTheDocument();
        });
    });
});
