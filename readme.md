# InteractiveVideo
ILIAS Interactive Video Plugin

## ILIAS compatibility
The 2.x version of the InteractiveVideo Plugin is only compatible with ILIAS versions 5.1.x and higher. If you looking for an version compatible with ILIAS 5.0.x please use the release_1 branch. 

## Important notice
If you upgrade to the 2.x version of the InteractiveVideo you can not go back to version 1.x, because there are migration steps which alter the database schema.

## Changes in Version 2.2.21
* Auto-resume
* Support of subtitles, if own player is used
* New Modal settings 

## Changes in Version 2.x
* Youtube Videos
* Source URL to videos
* Possibility to create plugins for more video sources
* Learning Progress
* HTML editor for comments, questions and usage of Latex possible
* [Complete Changelog](https://github.com/DatabayAG/InteractiveVideo/blob/master/CHANGELOG.md)

## Repositories connected to the InteractiveVideo Plugin
* [COPage Plugin for InteractiveVideo References in LearningModules](https://github.com/DatabayAG/InteractiveVideoReference)
* [Video Source Plugin for Vimeo](https://github.com/DatabayAG/InteractiveVideoVimeo)
* [Video Source Plugin for FAU Video Platform](https://github.com/ilifau/InteractiveVideoFauVideoPortal)

## Installation Instructions
1. Clone this repository to <ILIAS_DIRECTORY>/Customizing/global/plugins/Services/Repository/RepositoryObject/InteractiveVideo
2. Login to ILIAS with an administrator account (e.g. root)
3. Select **Plugins** from the **Administration** main menu drop down.
4. Search the **InteractiveVideo** plugin in the list of plugin and choose **Activate** from the **Actions** drop down.

### Workaround patch for making the Interactive Videos work with the Web Access Checker
Simply insert the following line into the file 'Services/MediaObjects/classes/class.ilObjMediaObject.php' at round about line number 1511, which should read like this in the original:

	case "mep":
		$obj_id = $id;
		break;

Insert     case "xvid":    to make it read like this:

	case "mep":
	case "xvid":
		$obj_id = $id;
		break;

That's it.

# What is it for?
The InteractiveVideo Plugin for ILIAS gives you the possibility to create a video object, where your students can communicate in a asynchronous way. Please note that this is *NOT* a chat. They can leave notes on different timestamps in the video for other students to read, or only for themselves. Further a tutor can insert questions on various positions in the video for the students to answer. At the moment three questions types are supported single and multiple choice and a reflective type. 

## Interactive Video Main View
![Main View](https://databayag.github.io/InteractiveVideo/2.0.x/1.png)

## Interactive Video Question View
![Question View](https://databayag.github.io/InteractiveVideo/2.0.x/2.png)
## Interactive Video Create Images from Media Object Source
![Create Images from Media Object Source](https://databayag.github.io/InteractiveVideo/2.0.x/3.png)

## Interactive Video Create Question
![Create Question](https://databayag.github.io/InteractiveVideo/2.0.x/4.png)

## Interactive Video Sources & Plugin Slots
![Main View](https://databayag.github.io/InteractiveVideo/2.0.x/5.png)

## Interactive Video Modal options
![Modal settings](https://databayag.github.io/InteractiveVideo/2.0.18/modal_options.png)

## Interactive Video Subtitles
![Subtitle](https://databayag.github.io/InteractiveVideo/2.0.21/subtitle.png)

