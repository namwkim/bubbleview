% remove files
% mixed= dir('./images/mixed/*.png');
% text= dir('./images/text/*.png');
% pictorial= dir('./images/pictorial/*.png');
% 
% % sample 17 images from each category
% ind = randsample(length(mixed), 17);
% sample_mixed = mixed(ind);
% ind = randsample(length(text), 17);
% sample_text = text(ind);
% ind = randsample(length(pictorial), 17);
% sample_pictorial = pictorial(ind);
% 
% all = [sample_mixed; sample_text; sample_pictorial];
% 
% savepath = './images/targets';
% if exist(savepath, 'dir')
%     rmdir(savepath,'s');
% end
% mkdir(savepath);
% 
% for i=1:length(all)
%     image = all(i);
%     imgpath = sprintf('./images/all/%s', image.name);
%     im = imread(imgpath);
%     imgpath = sprintf('./images/targets/%s', image.name);
%     imwrite(im, imgpath);
% end

% load all images
% 
% images = dir('./images/targets/*.png');
image = 'bbc';
radi = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
for i=1:length(radi)
%     blur_dir = sprintf('./images/targets_blurred_%d', radi(i));
%     if exist(blur_dir, 'dir')
%         rmdir(blur_dir,'s');
%     end
%     mkdir(blur_dir);
    H = fspecial('gaussian',radi(i),radi(i)); 

    % read image
%     for j=1:length(images)
%         imgpath = sprintf('./images/targets/%s', images(j).name);
%         im = imread(imgpath);
%         blurim = imfilter(im,H,'replicate');
%         imgpath = sprintf('./%s/%s', blur_dir, images(j).name);
%         imwrite(blurim, imgpath);
%     end
    imgpath = sprintf('./images/%s.png', image);
    im = imread(imgpath);
    blurim = imfilter(im,H,'replicate');
    imgpath = sprintf('./images/%s-blurred_%d.png',  image, radi(i));
    imwrite(blurim, imgpath);
end
    
% blur 
% save image