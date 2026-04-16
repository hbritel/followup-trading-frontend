import React from 'react';
import { ExternalLink, Copy, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonsProps {
  username: string;
  url: string;
}

const copyToClipboard = (url: string) => {
  navigator.clipboard.writeText(url).then(() => {
    toast.success('Link copied');
  });
};

const ShareButtons: React.FC<ShareButtonsProps> = ({ username, url }) => {
  const tweetText = encodeURIComponent('Check out my verified trading track record');
  const tweetUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        className="border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
            '_blank',
            'noopener,noreferrer',
          )
        }
      >
        <ExternalLink className="w-4 h-4 mr-1.5" />
        Twitter
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
        onClick={() => copyToClipboard(url)}
      >
        <Copy className="w-4 h-4 mr-1.5" />
        Copy Link
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
        onClick={() => copyToClipboard(url)}
      >
        <Link2 className="w-4 h-4 mr-1.5" />
        Discord
      </Button>
    </div>
  );
};

export default ShareButtons;
